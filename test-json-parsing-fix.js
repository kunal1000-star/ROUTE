#!/usr/bin/env node

/**
 * Test script to validate JSON parsing error fix
 * Tests that API endpoints return proper JSON responses instead of HTML error pages
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test function to make HTTP requests and validate responses
function testEndpoint(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        const isJSON = contentType.includes('application/json');
        
        resolve({
          statusCode: res.statusCode,
          contentType,
          isJSON,
          data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test cases
async function runTests() {
  console.log('🧪 Testing JSON parsing error fix...\n');

  const tests = [
    {
      name: 'GET /api/features/metrics',
      path: '/api/features/metrics',
      method: 'GET'
    },
    {
      name: 'GET /api/features/metrics with includeStatus',
      path: '/api/features/metrics?includeStatus=true',
      method: 'GET'
    },
    {
      name: 'POST /api/features/generate',
      path: '/api/features/generate',
      method: 'POST',
      body: {
        featureIds: [1, 2],
        userId: 'test-user',
        context: {
          studyData: { totalBlocks: 50, completedBlocks: 35, accuracy: 78 }
        }
      }
    },
    {
      name: 'POST /api/features/metrics (toggle feature)',
      path: '/api/features/metrics',
      method: 'POST',
      body: {
        featureId: 1,
        enabled: true
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      
      const response = await testEndpoint(test.path, {
        method: test.method,
        body: test.body
      });

      // Check if response is JSON
      if (!response.isJSON) {
        console.log(`❌ FAILED: Response is not JSON (Content-Type: ${response.contentType})`);
        console.log(`   Response preview: ${response.data.substring(0, 200)}...`);
        continue;
      }

      // Check if response status indicates error
      if (response.statusCode >= 400) {
        console.log(`⚠️  WARNING: HTTP ${response.statusCode} but response is valid JSON`);
      }

      // Try to parse JSON to ensure it's valid
      try {
        const parsed = JSON.parse(response.data);
        console.log(`✅ PASSED: Valid JSON response (${response.statusCode})`);
        if (response.statusCode >= 400) {
          console.log(`   Error details: ${parsed.error || 'No error details'}`);
        }
        passedTests++;
      } catch (parseError) {
        console.log(`❌ FAILED: Invalid JSON despite content-type header`);
        console.log(`   Parse error: ${parseError.message}`);
        console.log(`   Response: ${response.data.substring(0, 200)}...`);
      }

    } catch (error) {
      console.log(`❌ FAILED: Network error - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Test summary
  console.log('📊 Test Results Summary:');
  console.log(`   Passed: ${passedTests}/${totalTests} tests`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! JSON parsing error fix is working correctly.');
    console.log('✨ No more "Unexpected token \'<\'" errors - all API responses are proper JSON!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. The fix may need additional work.');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});