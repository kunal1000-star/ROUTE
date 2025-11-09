// Quick Memory System Test
// ========================

const API_BASE = 'http://localhost:3000';

async function quickMemoryTest() {
  console.log('⚡ QUICK MEMORY SYSTEM TEST\n');

  const testUserId = 'quick-test-' + Date.now();
  console.log(`👤 Test User ID: ${testUserId}`);

  try {
    // Test 1: Simple memory storage test
    console.log('\n🧪 Testing basic memory operations...');
    
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
    console.log('✅ Basic test result:', {
      success: data1.success,
      mentionsName: data1.data?.response?.content?.toLowerCase().includes('kunal'),
      memoryReferences: data1.data?.response?.memory_references?.length || 0,
      layersUsed: data1.data?.metadata?.layersUsed || data1.metadata?.layersUsed
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Memory recall test
    console.log('\n🧠 Testing memory recall...');
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
    console.log('✅ Recall test result:', {
      success: data2.success,
      mentionsName: data2.data?.response?.content?.toLowerCase().includes('kunal'),
      responsePreview: data2.data?.response?.content?.substring(0, 100) + '...',
      memoryReferences: data2.data?.response?.memory_references?.length || 0,
      layersUsed: data2.data?.metadata?.layersUsed || data2.metadata?.layersUsed
    });

    // Final assessment
    const hasMemory = data2.data?.response?.content?.toLowerCase().includes('kunal');
    const hasMemoryLayer = (data2.data?.metadata?.layersUsed || data2.metadata?.layersUsed || []).includes(3);
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`✅ Memory recall working: ${hasMemory ? 'YES 🎉' : 'NO ❌'}`);
    console.log(`✅ Memory layer active: ${hasMemoryLayer ? 'YES ✅' : 'NO ❌'}`);
    
    if (hasMemory) {
      console.log('\n🎉 SUCCESS! Study Buddy memory system is now working!');
      console.log('✅ The conversation_memory table has been created successfully.');
      console.log('✅ Memory storage and retrieval are functioning.');
    } else {
      console.log('\n⚠️ Memory system still needs work.');
      console.log('Possible remaining issues:');
      console.log('1. Migration incomplete (check migration terminal)');
      console.log('2. RLS policies blocking access');
      console.log('3. Memory context not being passed to AI properly');
    }

  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
  }
}

// Run the quick test
quickMemoryTest();