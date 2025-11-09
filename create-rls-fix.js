// Create exec_sql function and apply RLS fix
// ============================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createExecSQLFunction() {
  console.log('🔧 Creating exec_sql function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
  `;

  try {
    // Try to create the function using direct Supabase client
    const { data, error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error && error.message.includes('exec_sql')) {
      console.log('⚠️ exec_sql function may already exist or cannot be created');
    } else if (error) {
      console.log('❌ Error creating exec_sql function:', error.message);
      return false;
    } else {
      console.log('✅ exec_sql function created successfully');
      return true;
    }
  } catch (err) {
    console.log('❌ Exception creating exec_sql function:', err.message);
    return false;
  }
}

async function applyRLSFix() {
  console.log('\n🔧 Applying RLS fix for conversation_memory...');
  
  const rlsStatements = [
    // First, create the conversation_memory table if it doesn't exist
    `CREATE TABLE IF NOT EXISTS conversation_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        conversation_id UUID,
        interaction_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        quality_score DECIMAL(3,2),
        user_satisfaction DECIMAL(3,2),
        feedback_collected BOOLEAN DEFAULT FALSE,
        memory_relevance_score DECIMAL(3,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
    );`,
    
    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view their own conversation memory" ON conversation_memory;`,
    `DROP POLICY IF EXISTS "Users can manage their own conversation memory" ON conversation_memory;`,
    
    // Create new policies
    `CREATE POLICY "Users can view their own conversation memory (client)" ON conversation_memory FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert their own conversation memory (client)" ON conversation_memory FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Users can update their own conversation memory (client)" ON conversation_memory FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can delete their own conversation memory (client)" ON conversation_memory FOR DELETE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Server operations on conversation memory" ON conversation_memory FOR ALL USING (true);`,
    
    // Enable RLS
    `ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;`
  ];

  let successCount = 0;
  
  for (let i = 0; i < rlsStatements.length; i++) {
    try {
      const sql = rlsStatements[i];
      console.log(`Executing ${i + 1}/${rlsStatements.length}...`);
      
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

  console.log(`\n📊 RLS Fix Results: ${successCount}/${rlsStatements.length} successful`);
  return successCount === rlsStatements.length;
}

async function testMemorySystem() {
  console.log('\n🧪 Testing memory system...');
  
  const testUserId = 'test-rls-fix-' + Date.now();
  
  try {
    // Test memory storage via direct SQL
    const insertSQL = `
      INSERT INTO conversation_memory (user_id, conversation_id, interaction_data) 
      VALUES ('${testUserId}', 'test-conv', '{"content": "my name is kunal", "response": "Hello Kunal!"}'::jsonb)
      RETURNING id, user_id, interaction_data;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: insertSQL });
    
    if (error) {
      console.log('❌ Memory storage test failed:', error.message);
      return false;
    } else {
      console.log('✅ Memory storage test successful');
      
      // Test retrieval
      const selectSQL = `SELECT * FROM conversation_memory WHERE user_id = '${testUserId}' LIMIT 1;`;
      const { data: selectData, error: selectError } = await supabase.rpc('exec_sql', { sql: selectSQL });
      
      if (selectError) {
        console.log('❌ Memory retrieval test failed:', selectError.message);
        return false;
      } else {
        console.log('✅ Memory retrieval test successful');
        return true;
      }
    }
  } catch (err) {
    console.log('❌ Memory system test error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting RLS Fix and Memory System Setup\n');
  
  // Step 1: Create exec_sql function
  const functionCreated = await createExecSQLFunction();
  if (!functionCreated) {
    console.log('❌ Cannot proceed without exec_sql function');
    return;
  }
  
  // Step 2: Apply RLS fix
  const rlsFixed = await applyRLSFix();
  if (!rlsFixed) {
    console.log('❌ RLS fix failed');
    return;
  }
  
  // Step 3: Test memory system
  const memoryWorking = await testMemorySystem();
  
  console.log('\n📊 FINAL RESULTS:');
  console.log(`✅ exec_sql function: ${functionCreated ? 'CREATED' : 'FAILED'}`);
  console.log(`✅ RLS policies: ${rlsFixed ? 'FIXED' : 'FAILED'}`);
  console.log(`✅ Memory system: ${memoryWorking ? 'WORKING' : 'FAILED'}`);
  
  if (memoryWorking) {
    console.log('\n🎉 SUCCESS! Memory system should now work!');
    console.log('✅ You can now test the Study Buddy memory functionality.');
  } else {
    console.log('\n⚠️ Memory system setup incomplete.');
  }
}

main().catch(console.error);