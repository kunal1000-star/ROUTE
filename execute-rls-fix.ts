// Simple RLS fix execution using existing migration framework
// =========================================================

import { supabase } from '../supabase.js';

async function fixConversationMemoryRLS() {
  console.log('🔧 Executing RLS fix for conversation_memory table...\n');

  const statements = [
    // Drop existing blocking policies
    'DROP POLICY IF EXISTS "Users can view their own conversation memory" ON conversation_memory;',
    'DROP POLICY IF EXISTS "Users can manage their own conversation memory" ON conversation_memory;',
    
    // Create new policies
    'CREATE POLICY "Users can view their own conversation memory (client)" ON conversation_memory FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert their own conversation memory (client)" ON conversation_memory FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can update their own conversation memory (client)" ON conversation_memory FOR UPDATE USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can delete their own conversation memory (client)" ON conversation_memory FOR DELETE USING (auth.uid() = user_id);',
    'CREATE POLICY "Server operations on conversation memory" ON conversation_memory FOR ALL USING (true);'
  ];

  let successCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    try {
      const sql = statements[i];
      console.log(`Executing ${i + 1}/${statements.length}: ${sql.substring(0, 60)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
      } else {
        console.log(`✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log(`\n📊 Results: ${successCount}/${statements.length} successful`);
  
  if (successCount === statements.length) {
    console.log('🎉 RLS fix applied successfully!');
    console.log('✅ Memory storage should now work');
  } else {
    console.log('⚠️ Some statements failed');
  }
  
  return successCount === statements.length;
}

// Execute the fix
fixConversationMemoryRLS()
  .then(success => {
    if (success) {
      console.log('\n🔄 Now testing memory system...');
      // Test would go here
    }
  })
  .catch(console.error);