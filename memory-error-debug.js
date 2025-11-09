// Memory Storage Error Debug
// ==========================

const API_BASE = 'http://localhost:3000';

async function debugMemoryErrors() {
  console.log('🛠️ MEMORY STORAGE ERROR DEBUG\n');

  const testUserId = 'error-debug-' + Date.now();
  console.log(`👤 Test User ID: ${testUserId}\n`);

  try {
    // Test 1: Try direct memory storage via API if it exists
    console.log('🔍 Testing if memory storage API exists...');
    try {
      const directResponse = await fetch(`${API_BASE}/api/memory/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          memoryType: 'learning_interaction',
          content: 'my name is kunal',
          importanceScore: 5,
          tags: ['name', 'personal']
        })
      });

      const directData = await directResponse.json();
      console.log('📝 Direct memory storage result:', {
        status: directResponse.status,
        success: directData.success || directData.error ? false : true,
        error: directData.error,
        data: directData.data
      });
    } catch (error) {
      console.log('❌ Direct memory storage API failed:', error.message);
    }

    // Test 2: Check conversation_memory table directly (simulate a simple insert)
    console.log('\n🗄️ Testing conversation_memory table access...');
    try {
      const response = await fetch(`${API_BASE}/api/study-buddy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          conversationId: 'test-errors-' + Date.now(),
          message: 'my name is kunal and i am testing memory storage errors',
          operation: 'chat',
          chatType: 'study_assistant'
        })
      });

      const data = await response.json();
      console.log('💬 Study Buddy response:', {
        success: data.success,
        status: response.status,
        responsePreview: data.data?.response?.content?.substring(0, 100) + '...',
        // Check for error details in the response
        hasError: !!data.error,
        errorDetails: data.error,
        metadata: data.data?.metadata || data.metadata
      });

    } catch (error) {
      console.log('❌ Study Buddy call failed:', error.message);
    }

    // Test 3: Check RLS policies by testing a simple query
    console.log('\n🔒 Testing database access...');
    try {
      const memResponse = await fetch(`${API_BASE}/api/student/memories?userId=${testUserId}`);
      const memData = await memResponse.json();
      console.log('📊 Memory query result:', {
        success: memData.success,
        status: memResponse.status,
        memoriesFound: memData.data?.memories?.length || 0,
        error: memData.error,
        total: memData.data?.total || 0
      });

      if (!memData.success) {
        console.log('🚨 DATABASE ACCESS ISSUE DETECTED');
        console.log('Possible causes:');
        console.log('1. RLS policies blocking access');
        console.log('2. conversation_memory table missing');
        console.log('3. Supabase service role key missing');
        console.log('4. Database connection issues');
      }

    } catch (error) {
      console.log('❌ Memory query failed:', error.message);
    }

    // Summary
    console.log('\n📋 ERROR DIAGNOSIS SUMMARY:');
    console.log('The above tests will show us exactly where the memory system is failing.');
    console.log('If all tests fail, the issue is likely database configuration.');
    console.log('If only storage fails, the issue is likely RLS policies or table schema.');

  } catch (error) {
    console.error('❌ Error debug failed:', error.message);
  }
}

// Run the error debug
debugMemoryErrors();