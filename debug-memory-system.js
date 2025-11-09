// Comprehensive Memory System Debug Test
// =======================================

const API_BASE = 'http://localhost:3000';

async function debugMemorySystem() {
  console.log('🔍 COMPREHENSIVE MEMORY SYSTEM DEBUG\n');

  const testUserId = 'debug-user-kunal-' + Date.now();
  console.log(`👤 Test User ID: ${testUserId}\n`);

  try {
    // Step 1: Test memory storage
    console.log('📝 STEP 1: Testing memory storage...');
    const storeResponse = await fetch(`${API_BASE}/api/memory/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        memoryType: 'personal_info',
        content: 'my name is kunal',
        importanceScore: 5,
        tags: ['name', 'personal'],
        metadata: { test: true }
      })
    });

    const storeData = await storeResponse.json();
    console.log('✅ Memory Store Response:', {
      success: storeData.success,
      message: storeData.message,
      memoryId: storeData.data?.id
    });

    // Step 2: Test memory retrieval
    console.log('\n🔍 STEP 2: Testing memory retrieval...');
    const searchResponse = await fetch(`${API_BASE}/api/memory/search?userId=${testUserId}&query=my name`, {
      method: 'GET'
    });

    const searchData = await searchResponse.json();
    console.log('✅ Memory Search Response:', {
      success: searchData.success,
      memoriesFound: searchData.data?.memories?.length || 0,
      memories: searchData.data?.memories?.map(m => ({ id: m.id, content: m.content })) || []
    });

    // Step 3: Test Study Buddy with memory
    console.log('\n🤖 STEP 3: Testing Study Buddy with memory...');
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
    console.log('✅ Study Buddy Response 1 (Storing name):', {
      success: data1.success,
      content: data1.data?.response?.content?.substring(0, 100) + '...',
      memoryReferences: data1.data?.response?.memory_references?.length || 0,
      layersUsed: data1.metadata?.layersUsed
    });

    // Wait and test retrieval
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n🧠 STEP 4: Testing memory recall...');
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
    console.log('✅ Study Buddy Response 2 (Recalling name):', {
      success: data2.success,
      content: data2.data?.response?.content?.substring(0, 200) + '...',
      memoryReferences: data2.data?.response?.memory_references?.length || 0,
      layersUsed: data2.metadata?.layersUsed,
      includesName: data2.data?.response?.content?.toLowerCase().includes('kunal'),
      isMemoryAware: !data2.data?.response?.content?.toLowerCase().includes('don\'t have past memories')
    });

    // Analysis
    console.log('\n📊 ANALYSIS:');
    console.log(`- Memory storage: ${storeData.success ? '✅' : '❌'}`);
    console.log(`- Memory retrieval: ${searchData.success && (searchData.data?.memories?.length || 0) > 0 ? '✅' : '❌'}`);
    console.log(`- Study Buddy name mention: ${data2.data?.response?.content?.toLowerCase().includes('kunal') ? '✅' : '❌'}`);
    console.log(`- Memory context active: ${data2.metadata?.layersUsed?.includes(3) ? '✅' : '❌'}`);
    console.log(`- Memory references: ${(data2.data?.response?.memory_references?.length || 0) > 0 ? '✅' : '❌'}`);

    if (!data2.data?.response?.content?.toLowerCase().includes('kunal')) {
      console.log('\n🚨 ISSUE: Memory is still not working!');
      console.log('Possible causes:');
      console.log('1. Memory not being stored in database');
      console.log('2. Memory retrieval failing');
      console.log('3. Memory context not being passed to AI');
      console.log('4. AI not using the provided context');
    } else {
      console.log('\n🎉 SUCCESS: Memory system is working!');
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

// Run the test
debugMemorySystem();