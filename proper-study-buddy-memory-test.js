const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = 'https://oeqgzkwzxcpowgsfntuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWdreHp6eGNwb3dnc2ZudHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MzE1MjAsImV4cCI6MjA1MDQwNzUyMH0.sJAnLPnxXKlLLyPFbZJaECpAEDQvd3k9gLKw6vPG6iM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStudyBuddyMemorySystem() {
  console.log('🔍 TESTING STUDY BUDDY MEMORY SYSTEM');
  console.log('=====================================\n');

  const testUserId = 'comprehensive-study-buddy-test-1762701715000';
  const testConversationId = `test-conv-${Date.now()}`;

  console.log('👤 Test User ID:', testUserId);
  console.log('💬 Test Conversation ID:', testConversationId);
  console.log('');

  try {
    // Step 1: Store a memory (name information)
    console.log('🧠 Step 1: Storing name memory...');
    const storeResponse = await fetch('http://localhost:3000/api/study-buddy/store-memory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        conversationId: testConversationId,
        interactionData: {
          userMessage: 'My name is Kunal',
          userName: 'Kunal',
          importance: 'high',
          memoryType: 'personal_info'
        },
        memoryType: 'personal_info'
      })
    });

    const storeResult = await storeResponse.json();
    console.log('Store response status:', storeResponse.status);
    console.log('Store result:', JSON.stringify(storeResult, null, 2));
    console.log('');

    // Step 2: Test memory recall through Study Buddy API
    console.log('🔍 Step 2: Testing memory recall through Study Buddy API...');
    
    const recallResponse = await fetch('http://localhost:3000/api/study-buddy', {
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

    const recallResult = await recallResponse.json();
    console.log('Recall response status:', recallResponse.status);
    console.log('Recall result:');
    console.log('Response content:', recallResult.data?.response?.content);
    console.log('Memory references:', recallResult.data?.response?.memory_references);
    console.log('Layers used:', recallResult.data?.metadata?.layersUsed);
    console.log('');

    // Step 3: Test direct database query to see if memory was actually stored
    console.log('🗄️ Step 3: Direct database check...');
    const { data: memories, error } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('Database query error:', error);
    } else {
      console.log('Memories found in database:', memories?.length || 0);
      if (memories && memories.length > 0) {
        console.log('Most recent memory:', JSON.stringify(memories[0], null, 2));
      }
    }

    // Step 4: Test another personal query
    console.log('\n❓ Step 4: Testing another personal query...');
    const secondResponse = await fetch('http://localhost:3000/api/study-buddy', {
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

    const secondResult = await secondResponse.json();
    console.log('Second query result:');
    console.log('Response content:', secondResult.data?.response?.content);
    console.log('Memory references:', secondResult.data?.response?.memory_references);
    console.log('');

    // Final Analysis
    console.log('📊 MEMORY SYSTEM ANALYSIS');
    console.log('==========================');
    
    const layersUsed = recallResult.data?.metadata?.layersUsed || [];
    const hasMemoryLayer = layersUsed.includes(3);
    const hasMemoryReferences = recallResult.data?.response?.memory_references?.length > 0;
    const containsName = recallResult.data?.response?.content?.toLowerCase().includes('kunal');
    
    console.log('Memory layer activated:', hasMemoryLayer);
    console.log('Memory references found:', hasMemoryReferences);
    console.log('Response contains name:', containsName);
    console.log('Database memories stored:', memories?.length || 0);

    if (hasMemoryLayer && hasMemoryReferences && containsName) {
      console.log('\n✅ SUCCESS: Memory system is working correctly!');
    } else {
      console.log('\n❌ FAILURE: Memory system issues detected:');
      if (!hasMemoryLayer) console.log('  - Memory layer (layer 3) not activated');
      if (!hasMemoryReferences) console.log('  - No memory references in response');
      if (!containsName) console.log('  - Response does not contain the stored name');
      if ((memories?.length || 0) === 0) console.log('  - No memories found in database');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Start the test
testStudyBuddyMemorySystem();