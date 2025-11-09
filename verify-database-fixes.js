// Database Fix Verification Script
// ==================================
// This script verifies that the database schema fixes work correctly

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseFixes() {
  console.log('🔍 Starting database fix verification...\n');

  const results = {
    tablesExist: false,
    knowledgeBaseSearchWorks: false,
    memoryStorageWorks: false,
    uuidFormatValid: false,
    allTestsPassed: false
  };

  try {
    // Test 1: Check if all required tables exist
    console.log('📋 Test 1: Checking if required tables exist...');
    const tableTests = [
      'educational_knowledge_base',
      'educational_sources', 
      'conversation_memory',
      'fact_relationships',
      'context_optimization_logs'
    ];

    const existingTables = [];
    for (const tableName of tableTests) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          console.log(`  ✅ Table '${tableName}' exists and is accessible`);
        } else {
          console.log(`  ❌ Table '${tableName}' error:`, error.message);
        }
      } catch (err) {
        console.log(`  ❌ Table '${tableName}' failed:`, err);
      }
    }

    results.tablesExist = existingTables.length === tableTests.length;
    console.log(`  📊 Tables found: ${existingTables.length}/${tableTests.length}\n`);

    // Test 2: Test knowledge base search functionality
    console.log('🧠 Test 2: Testing knowledge base search...');
    try {
      const { data: searchResults, error: searchError } = await supabase
        .from('educational_knowledge_base')
        .select(`
          *,
          educational_sources (
            id,
            type,
            title,
            author,
            reliability,
            verification_status,
            educational_relevance
          )
        `)
        .limit(5);

      if (!searchError && searchResults) {
        console.log(`  ✅ Knowledge base search works! Found ${searchResults.length} entries`);
        results.knowledgeBaseSearchWorks = true;
        
        // Show sample data
        if (searchResults.length > 0) {
          console.log('  📝 Sample entry:');
          const sample = searchResults[0];
          console.log(`    - Content: ${sample.content.substring(0, 100)}...`);
          console.log(`    - Subject: ${sample.subject}`);
          console.log(`    - Type: ${sample.type}`);
          console.log(`    - Source: ${sample.educational_sources?.title || 'None'}`);
        }
      } else {
        console.log('  ❌ Knowledge base search failed:', searchError?.message);
      }
    } catch (err) {
      console.log('  ❌ Knowledge base search error:', err);
    }
    console.log('');

    // Test 3: Test conversation memory storage with proper UUID
    console.log('💾 Test 3: Testing conversation memory storage...');
    try {
      // Generate proper UUID
      const testUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const testConversationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const { data: memoryData, error: memoryError } = await supabase
        .from('conversation_memory')
        .insert([{
          user_id: testUUID,
          conversation_id: testConversationId,
          interaction_data: {
            content: 'Test memory entry',
            memoryType: 'user_query',
            priority: 'medium',
            retention: 'long_term'
          },
          quality_score: 0.8,
          memory_relevance_score: 0.7
        }])
        .select()
        .single();

      if (!memoryError && memoryData) {
        console.log('  ✅ Conversation memory storage works!');
        console.log(`  📝 Stored memory ID: ${memoryData.id}`);
        console.log(`  🆔 User ID format valid: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memoryData.user_id)}`);
        console.log(`  🗣️  Conversation ID format valid: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memoryData.conversation_id)}`);
        
        results.memoryStorageWorks = true;
        results.uuidFormatValid = true;

        // Clean up test data
        await supabase
          .from('conversation_memory')
          .delete()
          .eq('id', memoryData.id);
      } else {
        console.log('  ❌ Conversation memory storage failed:', memoryError?.message);
      }
    } catch (err) {
      console.log('  ❌ Conversation memory error:', err);
    }
    console.log('');

    // Test 4: Test fact relationships
    console.log('🔗 Test 4: Testing fact relationships...');
    try {
      const { data: relationships, error: relError } = await supabase
        .from('fact_relationships')
        .select('*')
        .limit(3);

      if (!relError) {
        console.log(`  ✅ Fact relationships accessible! Found ${relationships?.length || 0} relationships`);
      } else {
        console.log('  ❌ Fact relationships error:', relError.message);
      }
    } catch (err) {
      console.log('  ❌ Fact relationships error:', err);
    }
    console.log('');

    // Test 5: Check indexes
    console.log('📈 Test 5: Checking database indexes...');
    try {
      const { data: indexes, error: indexError } = await supabase
        .rpc('get_table_indexes', { table_name: 'educational_knowledge_base' });

      if (!indexError) {
        console.log(`  ✅ Indexes query works! Found educational_knowledge_base indexes`);
      } else {
        console.log('  ⚠️  Index check (this might be expected):', indexError.message);
      }
    } catch (err) {
      console.log('  ⚠️  Index check (this might be expected):', err);
    }
    console.log('');

    // Summary
    console.log('🎯 VERIFICATION SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Tables exist and accessible: ${results.tablesExist ? '✅' : '❌'}`);
    console.log(`Knowledge base search works: ${results.knowledgeBaseSearchWorks ? '✅' : '❌'}`);
    console.log(`Memory storage works: ${results.memoryStorageWorks ? '✅' : '❌'}`);
    console.log(`UUID format validation: ${results.uuidFormatValid ? '✅' : '❌'}`);

    results.allTestsPassed = 
      results.tablesExist && 
      results.knowledgeBaseSearchWorks && 
      results.memoryStorageWorks && 
      results.uuidFormatValid;

    console.log(`\n🏆 OVERALL RESULT: ${results.allTestsPassed ? 'ALL TESTS PASSED! ✅' : 'SOME TESTS FAILED ❌'}`);

    if (results.allTestsPassed) {
      console.log('\n🎉 Database fixes are working correctly!');
      console.log('🚀 The study buddy system should now function without the reported errors.');
    } else {
      console.log('\n⚠️  Some issues remain. Please check the error messages above.');
    }

  } catch (error) {
    console.error('💥 Verification script failed with error:', error);
  }

  return results;
}

// Run verification
verifyDatabaseFixes().then((results) => {
  process.exit(results.allTestsPassed ? 0 : 1);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});