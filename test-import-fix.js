// Simple test to verify MemoryQueries import works
// =================================================

// Test the import that was failing
try {
  console.log('🧪 Testing MemoryQueries import...');
  
  // This should work now
  const { MemoryQueries } = require('./src/lib/database/queries');
  
  console.log('✅ MemoryQueries import successful');
  console.log('✅ MemoryQueries class available:', typeof MemoryQueries);
  console.log('✅ Static methods available:', {
    addMemory: typeof MemoryQueries.addMemory,
    findSimilarMemories: typeof MemoryQueries.findSimilarMemories
  });
  
  console.log('\n🎉 Import fix successful! The build error should be resolved.');
  
} catch (error) {
  console.error('❌ Import still failing:', error.message);
  console.log('Need to investigate further...');
}