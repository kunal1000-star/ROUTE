// Direct Study Buddy Memory Test
// ================================

const API_BASE = 'http://localhost:3000';

async function testStudyBuddyMemory() {
  console.log('🧪 DIRECT STUDY BUDDY MEMORY TEST\n');

  const testUserId = 'test-kunal-' + Date.now();
  console.log(`👤 Test User ID: ${testUserId}\n`);

  try {
    console.log('📝 Step 1: Tell Study Buddy your name...');
    
    const response1 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'my name is kunal',
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data1 = await response1.json();
    console.log('✅ Response 1:', {
      success: data1.success,
      content: data1.data?.response?.content?.substring(0, 100) + '...',
      memoryReferences: (data1.data?.response?.memory_references?.length || 0) > 0,
      layersUsed: data1.data?.metadata?.layersUsed || data1.metadata?.layersUsed
    });

    // Wait a moment for memory to be stored
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🧠 Step 2: Ask if it knows your name...');
    
    const response2 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'do you know my name?',
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data2 = await response2.json();
    console.log('✅ Response 2:', {
      success: data2.success,
      content: data2.data?.response?.content?.substring(0, 200) + '...',
      memoryReferences: (data2.data?.response?.memory_references?.length || 0) > 0,
      layersUsed: data2.data?.metadata?.layersUsed || data2.metadata?.layersUsed,
      includesName: data2.data?.response?.content?.toLowerCase().includes('kunal'),
      isMemoryAware: !data2.data?.response?.content?.toLowerCase().includes('don\'t have past memories')
    });

    // Check if memory system is working
    console.log('\n📊 RESULTS:');
    const hasMemory = data2.data?.response?.content?.toLowerCase().includes('kunal');
    const hasContext = (data2.data?.response?.memory_references?.length || 0) > 0;
    const usesMemoryLayer = (data2.data?.metadata?.layersUsed || data2.metadata?.layersUsed || []).includes(3);

    console.log(`✅ Name recognition: ${hasMemory ? 'SUCCESS!' : 'FAILED ❌'}`);
    console.log(`✅ Memory context: ${hasContext ? 'ACTIVE' : 'MISSING'}`);
    console.log(`✅ Memory layer: ${usesMemoryLayer ? 'WORKING' : 'NOT ACTIVE'}`);

    if (hasMemory) {
      console.log('\n🎉 MEMORY SYSTEM IS WORKING! The AI remembered your name.');
      console.log('✅ The database table mismatch has been fixed.');
    } else {
      console.log('\n🚨 MEMORY STILL NOT WORKING.');
      console.log('Possible issues:');
      console.log('1. Server not running (check API_BASE)');
      console.log('2. Memory not being stored in conversation_memory table');
      console.log('3. Memory retrieval failing in memory-context-provider');
      console.log('4. AI not using the provided context properly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running on http://localhost:3000');
  }
}

// Run the test
testStudyBuddyMemory();