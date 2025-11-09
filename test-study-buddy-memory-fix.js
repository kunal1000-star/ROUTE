// Test script to verify Study Buddy memory integration
// ===================================================

const API_BASE = 'http://localhost:3000';

async function testStudyBuddyMemoryIntegration() {
  console.log('🧪 Testing Study Buddy Memory Integration...\n');

  // Test data
  const testUserId = 'test-user-kunal';
  const testMessage1 = 'my name is kunal';
  const testMessage2 = 'do you know my name?';

  try {
    console.log('📝 Step 1: Sending first message (declaring name)...');
    const response1 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        message: testMessage1,
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data1 = await response1.json();
    console.log('✅ Response 1:', {
      success: data1.success,
      content: data1.data?.response?.content?.substring(0, 100) + '...',
      memoryReferences: data1.data?.response?.memory_references?.length || 0,
      layersUsed: data1.metadata?.layersUsed
    });

    // Wait a moment for memory to be stored
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📝 Step 2: Sending follow-up question (testing memory)...');
    const response2 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        message: testMessage2,
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data2 = await response2.json();
    console.log('✅ Response 2:', {
      success: data2.success,
      content: data2.data?.response?.content?.substring(0, 100) + '...',
      memoryReferences: data2.data?.response?.memory_references?.length || 0,
      layersUsed: data2.metadata?.layersUsed,
      includesMemory: data2.data?.response?.content?.toLowerCase().includes('kunal')
    });

    // Analysis
    console.log('\n🔍 Analysis:');
    console.log(`- First response successful: ${data1.success ? '✅' : '❌'}`);
    console.log(`- Second response successful: ${data2.success ? '✅' : '❌'}`);
    console.log(`- Memory integration active: ${data2.metadata?.layersUsed?.includes(3) ? '✅' : '❌'}`);
    console.log(`- Memory references included: ${(data2.data?.response?.memory_references?.length || 0) > 0 ? '✅' : '❌'}`);
    console.log(`- Response mentions name: ${data2.data?.response?.content?.toLowerCase().includes('kunal') ? '✅' : '❌'}`);

    if (data2.data?.response?.content?.toLowerCase().includes('kunal')) {
      console.log('\n🎉 SUCCESS: Chat memory is now working! The AI remembered your name.');
    } else {
      console.log('\n⚠️  ISSUE: Memory integration may need debugging.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStudyBuddyMemoryIntegration();