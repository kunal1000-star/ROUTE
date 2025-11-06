// Profile API Test
// =================

const testProfileAPI = async () => {
  console.log('🧪 Testing Student Profile API...');
  
  // Test with a mock userId
  const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Sample UUID format
  
  try {
    const response = await fetch(`http://localhost:3000/api/student/profile?userId=${testUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('🎉 Profile API test PASSED');
      return true;
    } else {
      console.log('❌ Profile API test FAILED:', result.error);
      return false;
    }
  } catch (error) {
    console.error('💥 Profile API test error:', error);
    return false;
  }
};

// Run the test
testProfileAPI().then(success => {
  if (success) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed!');
  }
});
