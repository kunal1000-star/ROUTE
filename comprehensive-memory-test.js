// Comprehensive Memory System Test After RLS Fix
// ===============================================

const API_BASE = 'http://localhost:3000';

async function comprehensiveMemoryTest() {
  console.log('🔍 COMPREHENSIVE MEMORY TEST AFTER RLS FIX\n');

  const testUserId = 'comprehensive-test-' + Date.now();
  console.log(`👤 Test User ID: ${testUserId}`);

  try {
    // Step 1: Check if conversation_memory table exists and is accessible
    console.log('\n🗄️ Step 1: Testing table accessibility...');
    try {
      const memCheck = await fetch(`${API_BASE}/api/student/memories?userId=${testUserId}`);
      const memData = await memCheck.json();
      console.log('📊 Table accessibility test:', {
        success: memData.success,
        status: memCheck.status,
        error: memData.error,
        memoriesFound: memData.data?.memories?.length || 0
      });

      if (!memData.success) {
        console.log('❌ Database access is still failing');
        console.log('Error details:', memData.error);
        return;
      }
    } catch (error) {
      console.log('❌ Database access test failed:', error.message);
      return;
    }

    // Step 2: Test memory storage via Study Buddy
    console.log('\n💾 Step 2: Testing memory storage...');
    const response1 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'my name is kunal and i am testing the memory system after rls fix',
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data1 = await response1.json();
    console.log('💬 Storage test response:', {
      success: data1.success,
      responsePreview: data1.data?.response?.content?.substring(0, 100) + '...',
      hasMemoryReferences: (data1.data?.response?.memory_references?.length || 0) > 0,
      layersUsed: data1.data?.metadata?.layersUsed || data1.metadata?.layersUsed
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Check if memory was actually stored
    console.log('\n🔍 Step 3: Checking if memory was stored...');
    const memCheck2 = await fetch(`${API_BASE}/api/student/memories?userId=${testUserId}`);
    const memData2 = await memCheck2.json();
    console.log('📊 Memory storage verification:', {
      success: memData2.success,
      memoriesFound: memData2.data?.memories?.length || 0,
      memoryDetails: memData2.data?.memories?.map(m => ({
        id: m.id,
        content: m.content?.substring(0, 50),
        tags: m.tags,
        created_at: m.created_at
      })) || []
    });

    // Step 4: Test memory retrieval
    console.log('\n🧠 Step 4: Testing memory retrieval...');
    const response2 = await fetch(`${API_BASE}/api/study-buddy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        message: 'what is my name?',
        operation: 'chat',
        chatType: 'study_assistant'
      })
    });

    const data2 = await response2.json();
    console.log('🧠 Retrieval test response:', {
      success: data2.success,
      mentionsName: data2.data?.response?.content?.toLowerCase().includes('kunal'),
      responsePreview: data2.data?.response?.content?.substring(0, 150) + '...',
      hasMemoryReferences: (data2.data?.response?.memory_references?.length || 0) > 0,
      layersUsed: data2.data?.metadata?.layersUsed || data2.metadata?.layersUsed
    });

    // Final analysis
    console.log('\n📋 COMPREHENSIVE ANALYSIS:');
    const dbAccessible = memData2.success;
    const hasStoredMemories = (memData2.data?.memories?.length || 0) > 0;
    const hasMemoryRecall = data2.data?.response?.content?.toLowerCase().includes('kunal');
    const hasMemoryLayer = (data2.data?.metadata?.layersUsed || data2.metadata?.layersUsed || []).includes(3);

    console.log(`✅ Database accessible: ${dbAccessible ? 'YES' : 'NO'}`);
    console.log(`✅ Memories stored: ${hasStoredMemories ? 'YES' : 'NO'}`);
    console.log(`✅ Memory recall working: ${hasMemoryRecall ? 'YES 🎉' : 'NO ❌'}`);
    console.log(`✅ Memory layer active: ${hasMemoryLayer ? 'YES' : 'NO'}`);

    if (hasMemoryRecall) {
      console.log('\n🎉 SUCCESS! Memory system is now fully working!');
      console.log('✅ All components are functioning correctly.');
    } else if (hasStoredMemories) {
      console.log('\n⚠️ PARTIAL SUCCESS: Memory is stored but not being used by AI');
      console.log('Issue: Memory context is not being passed to the AI properly');
    } else if (dbAccessible) {
      console.log('\n⚠️ DATABASE WORKS: Table is accessible but memory storage is failing');
      console.log('Issue: Memory storage is still blocked by RLS or other permissions');
    } else {
      console.log('\n❌ CRITICAL: Database access is still failing');
      console.log('Issue: conversation_memory table may not exist or RLS is still blocking access');
    }

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
  }
}

// Run the comprehensive test
comprehensiveMemoryTest();