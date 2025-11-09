// Apply RLS fix for conversation_memory table
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix for conversation_memory table...\n');

  const sqlStatements = [
    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view their own conversation memory" ON conversation_memory;`,
    `DROP POLICY IF EXISTS "Users can manage their own conversation memory" ON conversation_memory;`,
    
    // Create new policies
    `CREATE POLICY "Users can view their own conversation memory (client)" ON conversation_memory FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert their own conversation memory (client)" ON conversation_memory FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Users can update their own conversation memory (client)" ON conversation_memory FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can delete their own conversation memory (client)" ON conversation_memory FOR DELETE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Server operations on conversation memory" ON conversation_memory FOR ALL USING (true);`,
    
    // Grant permissions
    `GRANT ALL ON conversation_memory TO authenticated;`,
    `GRANT USAGE ON SCHEMA public TO authenticated;`
  ];

  let successCount = 0;
  
  for (const [index, sql] of sqlStatements.entries()) {
    try {
      console.log(`📝 Executing statement ${index + 1}/${sqlStatements.length}...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.log(`❌ Statement ${index + 1} failed:`, error.message);
      } else {
        console.log(`✅ Statement ${index + 1} succeeded`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Statement ${index + 1} error:`, err.message);
    }
  }

  console.log(`\n📊 RLS Fix Results: ${successCount}/${sqlStatements.length} statements successful`);
  
  if (successCount === sqlStatements.length) {
    console.log('\n🎉 SUCCESS! RLS policies have been fixed.');
    console.log('✅ Memory storage should now work without authentication errors.');
  } else {
    console.log('\n⚠️ Some statements failed. Check the errors above.');
  }
}

// Run the fix
applyRLSFix().catch(console.error);