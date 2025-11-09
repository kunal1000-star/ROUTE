async function testDebugStudyBuddyAPI() {
  console.log('🔍 TESTING DEBUG STUDY BUDDY API');
  console.log('=================================\n');

  const testUserId = 'debug-test-kunal-1762702485000';
  const testConversationId = `debug-conv-${Date.now()}`;

  console.log('👤 Test User ID:', testUserId);
  console.log('💬 Test Conversation ID:', testConversationId);
  console.log('');

  try {
    // Test 1: Personal query that should trigger memory
    console.log('🧠 Test 1: Personal query - "My name is Kunal"');
    
    const response1 = await fetch('http://localhost:3000/api/study-buddy-debug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        conversationId: testConversationId,
        message: 'My name is Kunal',
        operation: 'chat'
      })
    });

    console.log('Response 1 status:', response1.status);
    const result1 = await response1.json();
    
    console.log('Response 1 data:');
    console.log('- Success:', result1.success);
    console.log('- Content:', result1.data?.response?.content);
    console.log('- Layers used:', result1.data?.metadata?.layersUsed);
    console.log('- Memory references:', result1.data?.response?.memory_references);
    console.log('- Debug info:', result1.debug);
    console.log('');

    // Test 2: Second personal query to test memory retrieval
    console.log('🔍 Test 2: Personal query - "Do you know my name?"');
    
    const response2 = await fetch('http://localhost:3000/api/study-buddy-debug', {
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

    console.log('Response 2 status:', response2.status);
    const result2 = await response2.json();
    
    console.log('Response 2 data:');
    console.log('- Success:', result2.success);
    console.log('- Content:', result2.data?.response?.content);
    console.log('- Layers used:', result2.data?.metadata?.layersUsed);
    console.log('- Memory references:', result2.data?.response?.memory_references);
    console.log('- Debug info:', result2.debug);
    console.log('');

    // Test 3: Third personal query
    console.log('❓ Test 3: Personal query - "What is my name?"');
    
    const response3 = await fetch('http://localhost:3000/api/study-buddy-debug', {
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

    console.log('Response 3 status:', response3.status);
    const result3 = await response3.json();
    
    console.log('Response 3 data:');
    console.log('- Success:', result3.success);
    console.log('- Content:', result3.data?.response?.content);
    console.log('- Layers used:', result3.data?.metadata?.layersUsed);
    console.log('- Memory references:', result3.data?.response?.memory_references);
    console.log('- Debug info:', result3.debug);
    console.log('');

    // Analysis
    console.log('📊 FINAL ANALYSIS');
    console.log('==================');
    
    const test1Layers = result1.data?.metadata?.layersUsed || [];
    const test1Memory = result1.data?.response?.memory_references || [];
    const test1ContainsName = result1.data?.response?.content?.toLowerCase().includes('kunal');
    
    const test2Layers = result2.data?.metadata?.layersUsed || [];
    const test2Memory = result2.data?.response?.memory_references || [];
    const test2ContainsName = result2.data?.response?.content?.toLowerCase().includes('kunal');
    
    const test3Layers = result3.data?.metadata?.layersUsed || [];
    const test3Memory = result3.data?.response?.memory_references || [];
    const test3ContainsName = result3.data?.response?.content?.toLowerCase().includes('kunal');
    
    console.log('Test 1 (Name introduction):');
    console.log('  - Memory layer activated:', test1Layers.includes(3));
    console.log('  - Memory references:', test1Memory.length > 0);
    console.log('  - Response mentions "Kunal":', test1ContainsName);
    
    console.log('Test 2 (Memory recall attempt):');
    console.log('  - Memory layer activated:', test2Layers.includes(3));
    console.log('  - Memory references:', test2Memory.length > 0);
    console.log('  - Response mentions "Kunal":', test2ContainsName);
    
    console.log('Test 3 (Another memory test):');
    console.log('  - Memory layer activated:', test3Layers.includes(3));
    console.log('  - Memory references:', test3Memory.length > 0);
    console.log('  - Response mentions "Kunal":', test3ContainsName);

    // Debug info analysis
    console.log('\n🔍 Debug Info Analysis:');
    const debug1 = result1.debug;
    const debug2 = result2.debug;
    const debug3 = result3.debug;
    
    console.log('Test 1 debug memory context:', {
      found: debug1?.memoryContext?.found,
      length: debug1?.memoryContext?.length,
      memoriesCount: debug1?.memoryContext?.memoriesCount,
      personalFactsCount: debug1?.memoryContext?.personalFactsCount
    });
    
    console.log('Test 2 debug memory context:', {
      found: debug2?.memoryContext?.found,
      length: debug2?.memoryContext?.length,
      memoriesCount: debug2?.memoryContext?.memoriesCount,
      personalFactsCount: debug2?.memoryContext?.personalFactsCount
    });
    
    console.log('Test 3 debug memory context:', {
      found: debug3?.memoryContext?.found,
      length: debug3?.memoryContext?.length,
      memoriesCount: debug3?.memoryContext?.memoriesCount,
      personalFactsCount: debug3?.memoryContext?.personalFactsCount
    });

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Start the debug test
testDebugStudyBuddyAPI();