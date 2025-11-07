// Simple AI System Import Test
// ============================

console.log('🔍 Testing AI System Import Compatibility...\n');

// Test 1: Environment variables
console.log('📋 Testing Environment Variables...');
const envVars = ['GROQ_API_KEY', 'GEMINI_API_KEY', 'MISTRAL_API_KEY', 'CEREBRAS_API_KEY', 'COHERE_API_KEY', 'OPENROUTER_API_KEY'];
const availableEnvVars = envVars.filter(varName => !!process.env[varName]);
console.log(`✅ Environment Variables: ${availableEnvVars.length}/${envVars.length} available`);
console.log(`Available: ${availableEnvVars.join(', ')}`);

if (availableEnvVars.length > 0) {
  console.log('Missing:', envVars.filter(varName => !availableEnvVars.includes(varName)).join(', '));
}

console.log('\n🔧 Testing Import Compatibility...');

// Test 2: Import provider clients individually
const importTests = [
  { name: 'Groq Client', importFunc: async () => await import('@/lib/ai/providers/groq-client') },
  { name: 'Gemini Client', importFunc: async () => await import('@/lib/ai/providers/gemini-client') },
  { name: 'Mistral Client', importFunc: async () => await import('@/lib/ai/providers/mistral-client') },
  { name: 'Cerebras Client', importFunc: async () => await import('@/lib/ai/providers/cerebras-client') },
  { name: 'Cohere Client', importFunc: async () => await import('@/lib/ai/providers/cohere-client') },
  { name: 'OpenRouter Client', importFunc: async () => await import('@/lib/ai/providers/openrouter-client') },
  { name: 'Service Manager', importFunc: async () => await import('@/lib/ai/ai-service-manager-unified') },
  { name: 'Response Cache', importFunc: async () => await import('@/lib/ai/response-cache') },
  { name: 'API Logger', importFunc: async () => await import('@/lib/ai/api-logger') },
  { name: 'Rate Limit Tracker', importFunc: async () => await import('@/lib/ai/rate-limit-tracker') }
];

async function runImportTests() {
  const results: Array<{ name: string, status: 'PASS' | 'FAIL', error?: string, details?: any }> = [];
  
  for (const test of importTests) {
    try {
      console.log(`Testing ${test.name}...`);
      const startTime = Date.now();
      const module = await test.importFunc();
      const endTime = Date.now();
      
      // Check if module has expected exports
      const exports = Object.keys(module);
      console.log(`  ✅ ${test.name}: Imported in ${endTime - startTime}ms`);
      console.log(`     Exports: ${exports.join(', ')}`);
      
      results.push({
        name: test.name,
        status: 'PASS',
        details: {
          exportCount: exports.length,
          exports: exports,
          importTime: endTime - startTime
        }
      });
    } catch (error) {
      console.error(`  ❌ ${test.name}: Failed to import - ${error instanceof Error ? error.message : String(error)}`);
      results.push({
        name: test.name,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return results;
}

// Run the tests
runImportTests()
  .then((results) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 IMPORT TEST RESULTS');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    
    console.log(`\n📊 Summary: ${passed} PASS, ${failed} FAIL`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Imports:');
      for (const result of results.filter(r => r.status === 'FAIL')) {
        console.log(`  • ${result.name}: ${result.error}`);
      }
    }
    
    if (passed > 0) {
      console.log('\n✅ Successful Imports:');
      for (const result of results.filter(r => r.status === 'PASS')) {
        console.log(`  • ${result.name}: ${result.details?.exportCount} exports`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 Next Steps:');
    
    if (failed === 0) {
      console.log('✅ All imports successful! Ready to test provider functionality.');
    } else {
      console.log('🔧 Fix import errors before testing provider functionality.');
      console.log('Most likely issues:');
      console.log('  1. Missing or invalid API key environment variables');
      console.log('  2. TypeScript configuration issues');
      console.log('  3. Module resolution problems');
      console.log('  4. Missing dependencies');
    }
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
  });
