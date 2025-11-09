// Comprehensive Memory System Diagnosis
// =====================================

const API_BASE = 'http://localhost:3000';

async function diagnoseMemorySystem() {
  console.log('🔍 COMPREHENSIVE MEMORY SYSTEM DIAGNOSIS\n');

  const testUserId = 'diagnostic-user-' + Date.now();
  console.log(`👤 Test User ID: ${testUserId}\n`);

  try {
    // Step 1: Test if Study Buddy API is accessible
    console.log('📡 STEP 1: Testing API accessibility...');
    try {
      const healthResponse = await fetch(`${API_BASE}/api/study-buddy`, {
        method: 'GET'
      });
      console.log(`✅ Study Buddy API health: ${healthResponse.status}`);
    } catch (error) {
      console.log(`❌ Study Buddy API not accessible: ${error.message}`);
      return;
    }

    // Step 2: Test memory storage attempt
    console.log('\n💾 STEP 2: Testing memory storage...');
    try {
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
      console.log('📝 Storage attempt result:', {
        success: data1.success,
        hasResponse: !!data1.data?.response,
        responsePreview: data1.data?.response?.content?.substring(0, 100) + '...',
        memoryReferences: data1.data?.response?.memory_references?.length || 0,
        hasMetadata: !!data1.data?.metadata || !!data1.metadata
      });

      // Check console logs for memory operations
      console.log('💭 Check server console for memory storage logs...');

    } catch (error) {
      console.log(`❌ Storage attempt failed: ${error.message}`);
    }

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Test memory retrieval
    console.log('\n🔍 STEP 3: Testing memory retrieval...');
    try {
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
      console.log('🧠 Retrieval attempt result:', {
        success: data2.success,
        hasResponse: !!data2.data?.response,
        responsePreview: data2.data?.response?.content?.substring(0, 150) + '...',
        mentionsName: data2.data?.response?.content?.toLowerCase().includes('kunal'),
        memoryReferences: data2.data?.response?.memory_references?.length || 0,
        layersUsed: data2.data?.metadata?.layersUsed || data2.metadata?.layersUsed,
        hasMemoryOptimization: (data2.data?.metadata?.optimizationsApplied || data2.metadata?.optimizationsApplied || []).includes('memory_integration')
      });

    } catch (error) {
      console.log(`❌ Retrieval attempt failed: ${error.message}`);
    }

    // Step 4: Direct memory query test
    console.log('\n🗄️ STEP 4: Direct database query test...');
    try {
      // Test the student memories endpoint
      const memResponse = await fetch(`${API_BASE}/api/student/memories?userId=${testUserId}`);
      const memData = await memResponse.json();
      console.log('📊 Direct memory query:', {
        success: memData.success,
        memoriesFound: memData.data?.memories?.length || 0,
        memories: memData.data?.memories?.map(m => ({ id: m.id, content: m.content?.substring(0, 50) })) || []
      });

    } catch (error) {
      console.log(`❌ Direct memory query failed: ${error.message}`);
    }

    // Final analysis
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('If you see "memoriesFound: 0" above, the issue is memory storage.');
    console.log('If memoriesFound > 0 but no name recognition, the issue is retrieval/context.');
    console.log('If both work but AI ignores context, the issue is prompt integration.');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Run the diagnosis
diagnoseMemorySystem();