const { createClient } = require('@supabase/supabase-js');

// Test configuration  
const SUPABASE_URL = 'https://oeqgzkwzxcpowgsfntuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWdreHp6eGNwb3dnc2ZudHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MzE1MjAsImV4cCI6MjA1MDQwNzUyMH0.sJAnLPnxXKlLLyPFbZJaECpAEDQvd3k9gLKw6vPG6iM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStudyBuddyMemoryFlow() {
  console.log('🔍 TESTING STUDY BUDDY MEMORY FLOW');
  console.log('===================================\n');

  const testUserId = 'comprehensive-test-study-buddy-1762701720000';
  const testConversationId = `test-conv-${Date.now()}`;

  console.log('👤 Test User ID:', testUserId);
  console.log('💬 Test Conversation ID:', testConversationId);
  console.log('');

  try {
    // Step 1: First, manually store a memory directly in database
    console.log('🗄️ Step 1: Manually storing memory in database...');
    const { data: storedMemory, error: storeError } = await supabase
      .from('conversation_memory')
      .insert({
        user_id: testUserId,
        conversation_id: testConversationId,
        interaction_data: {
          userMessage: 'My name is Kunal',
          userName: 'Kunal', 
          importance: 'high',
          memoryType: 'personal_info',
          source: 'test_insert'
        },
        quality_score: 0.9,
        memory_relevance_score: 0.95
      })
      .select()
      .single();

    if (storeError) {
      console.log('❌ Failed to store memory:', storeError);
    } else {
      console.log('✅ Memory stored successfully:', storedMemory?.id);
    }
    console.log('');

    // Step 2: Test memory retrieval through Study Buddy API (personal query)
    console.log('🔍 Step 2: Testing memory retrieval with "Do you know my name?"...');
    
    const response1 = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        conversationId: testConversationId,
        message: 'Do you know my name?',
        operation: 'chat'
      })
    });

    const result1 = await response1.json();
    console.log('Response 1 status:', response1.status);
    console.log('Response content:', result1.data?.response?.content);
    console.log('Memory references:', result1.data?.response?.memory_references);
    console.log('Layers used:', result1.data?.metadata?.layersUsed);
    console.log('');

    // Step 3: Test another personal query
    console.log('❓ Step 3: Testing "What is my name?"...');
    
    const response2 = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        conversationId: testConversationId,
        message: 'What is my name?',
        operation: 'chat'
      })
    });

    const result2 = await response2.json();
    console.log('Response 2 status:', response2.status);
    console.log('Response content:', result2.data?.response?.content);
    console.log('Memory references:', result2.data?.response?.memory_references);
    console.log('Layers used:', result2.data?.metadata?.layersUsed);
    console.log('');

    // Step 4: Check what memories are actually in the database
    console.log('🗄️ Step 4: Checking database for memories...');
    const { data: memories, error: queryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) {
      console.log('❌ Database query error:', queryError);
    } else {
      console.log('✅ Database query successful');
      console.log('Memories found:', memories?.length || 0);
      if (memories && memories.length > 0) {
        console.log('Most recent memory:', JSON.stringify(memories[0], null, 2));
      }
    }
    console.log('');

    // Step 5: Test if the memoryContextProvider works directly
    console.log('🔍 Step 5: Testing memoryContextProvider directly...');
    
    const { memoryContextProvider } = require('./src/lib/ai/memory-context-provider');
    
    const memoryResult = await memoryContextProvider.getMemoryContext({
      userId: testUserId,
      query: 'Do you know my name?',
      chatType: 'study_assistant',
      isPersonalQuery: true,
      contextLevel: 'comprehensive',
      limit: 8
    });
    
    console.log('Direct memory context provider result:');
    console.log('Memories found:', memoryResult.memories?.length || 0);
    console.log('Context string length:', memoryResult.contextString?.length || 0);
    console.log('Search stats:', memoryResult.searchStats);
    console.log('');

    // Final Analysis
    console.log('📊 FINAL MEMORY SYSTEM ANALYSIS');
    console.log('================================');
    
    const response1Layers = result1.data?.metadata?.layersUsed || [];
    const response1Memory = result1.data?.response?.memory_references || [];
    const response1ContainsName = result1.data?.response?.content?.toLowerCase().includes('kunal');
    
    const response2Layers = result2.data?.metadata?.layersUsed || [];
    const response2Memory = result2.data?.response?.memory_references || [];
    const response2ContainsName = result2.data?.response?.content?.toLowerCase().includes('kunal');
    
    console.log('Query 1 - Memory layer activated:', response1Layers.includes(3));
    console.log('Query 1 - Memory references found:', response1Memory.length > 0);
    console.log('Query 1 - Response contains "Kunal":', response1ContainsName);
    
    console.log('Query 2 - Memory layer activated:', response2Layers.includes(3));
    console.log('Query 2 - Memory references found:', response2Memory.length > 0);
    console.log('Query 2 - Response contains "Kunal":', response2ContainsName);
    
    console.log('Database memories count:', memories?.length || 0);
    console.log('Direct memory provider memories:', memoryResult.memories?.length || 0);

    // Success criteria
    const hasMemoryLayer = response1Layers.includes(3) || response2Layers.includes(3);
    const hasMemoryReferences = response1Memory.length > 0 || response2Memory.length > 0;
    const containsName = response1ContainsName || response2ContainsName;
    const hasDatabaseMemories = (memories?.length || 0) > 0;
    const providerWorks = (memoryResult.memories?.length || 0) > 0;

    console.log('\n📋 SUCCESS CRITERIA CHECK:');
    console.log('Memory layer (3) activated:', hasMemoryLayer ? '✅' : '❌');
    console.log('Memory references in response:', hasMemoryReferences ? '✅' : '❌');
    console.log('Response contains stored name:', containsName ? '✅' : '❌');
    console.log('Database contains memories:', hasDatabaseMemories ? '✅' : '❌');
    console.log('Memory provider works:', providerWorks ? '✅' : '❌');

    if (hasMemoryLayer && hasMemoryReferences && containsName && hasDatabaseMemories && providerWorks) {
      console.log('\n🎉 SUCCESS: All memory system components working correctly!');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some components working, issues detected:');
      if (!hasMemoryLayer) console.log('  - Study Buddy API not activating memory layer (3)');
      if (!hasMemoryReferences) console.log('  - Study Buddy API not including memory references');
      if (!containsName) console.log('  - Study Buddy API responses not using stored memories');
      if (!hasDatabaseMemories) console.log('  - Database storage issues');
      if (!providerWorks) console.log('  - Memory context provider not working');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Start the test
testStudyBuddyMemoryFlow();