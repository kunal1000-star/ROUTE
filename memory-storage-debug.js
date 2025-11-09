// Memory Storage Debug Test
// ========================

const API_BASE = 'http://localhost:3000';

async function testMemoryStorageDebug() {
  console.log('🔧 MEMORY STORAGE DEBUG TEST\n');

  const testUserId = 'debug-storage-' + Date.now();
  console.log(`👤 Test User ID: ${testUserId}`);

  try {
    // Test 1: Check what conversationId gets generated
    console.log('\n📝 Testing with explicit conversation ID...');
    
    const response1 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        conversationId: 'test-conv-' + Date.now(), // Explicit conversation ID
        message: 'my name is kunal',
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data1 = await response1.json();
    console.log('✅ Response with explicit conversationId:', {
      success: data1.success,
      conversationId: data1.data?.conversationId,
      responsePreview: data1.data?.response?.content?.substring(0, 80) + '...'
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Check if memory was stored
    console.log('\n🔍 Checking if memory was stored...');
    const memCheck = await fetch(`${API_BASE}/api/student/memories?userId=${testUserId}`);
    const memData = await memCheck.json();
    console.log('📊 Memory check result:', {
      success: memData.success,
      memoriesFound: memData.data?.memories?.length || 0,
      memoryDetails: memData.data?.memories?.map(m => ({
        id: m.id,
        content: m.content?.substring(0, 50),
        tags: m.tags
      })) || []
    });

    // Test 3: Ask about name again
    console.log('\n🧠 Testing memory recall...');
    const response2 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        conversationId: data1.data?.conversationId, // Use same conversation ID
        message: 'do you know my name?',
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data2 = await response2.json();
    console.log('✅ Memory recall result:', {
      success: data2.success,
      mentionsName: data2.data?.response?.content?.toLowerCase().includes('kunal'),
      responsePreview: data2.data?.response?.content?.substring(0, 100) + '...',
      memoryReferences: data2.data?.response?.memory_references?.length || 0
    });

    // Analysis
    console.log('\n📋 ANALYSIS:');
    const hasMemories = (memData.data?.memories?.length || 0) > 0;
    const hasNameRecall = data2.data?.response?.content?.toLowerCase().includes('kunal');
    
    console.log(`- Memory storage working: ${hasMemories ? 'YES ✅' : 'NO ❌'}`);
    console.log(`- Memory recall working: ${hasNameRecall ? 'YES ✅' : 'NO ❌'}`);
    
    if (!hasMemories) {
      console.log('\n🚨 MEMORY STORAGE IS FAILING');
      console.log('Possible causes:');
      console.log('1. Database table "conversation_memory" missing or wrong schema');
      console.log('2. Database permissions/RLS policies blocking inserts');
      console.log('3. storeMemory() function throwing silent errors');
      console.log('4. Supabase client configuration issues');
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

// Run the test
testMemoryStorageDebug();