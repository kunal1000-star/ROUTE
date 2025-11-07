// Test script to verify authentication fix
const fetch = require('node-fetch');

async function testAuthentication() {
  console.log('🧪 Testing authentication fix...');
  
  try {
    // Test the suggestions API with NextAuth headers
    const response = await fetch('http://localhost:3003/api/suggestions', {
      method: 'GET',
      headers: {
        'X-NextAuth-User': 'test@example.com',
        'X-NextAuth-Id': 'test-user-id-123',
        'X-NextAuth-Email': 'test@example.com',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📋 Response body:', text);
    
    if (response.ok) {
      console.log('✅ Authentication test PASSED - API responded successfully');
    } else {
      console.log('❌ Authentication test FAILED - API returned error');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAuthentication();