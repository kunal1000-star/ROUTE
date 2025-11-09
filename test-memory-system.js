// Test Script for Memory System
// ==============================

const { memoryContextProvider } = require('./src/lib/ai/memory-context-provider.ts');

// Test the memory system with a fake user ID
const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Example UUID
const testQuery = 'Do you know my name?';

async function testMemorySystem() {
  console.log('🧠 Testing Memory System...');
  console.log('===========================================');
  
  try {
    console.log(`\n📝 Testing query: "${testQuery}"`);
    console.log(`👤 User ID: ${testUserId}`);
    
    // Test memory context retrieval
    const result = await memoryContextProvider.getMemoryContext({
      userId: testUserId,
      query: testQuery,
      chatType: 'study_assistant',
      isPersonalQuery: true,
      contextLevel: 'comprehensive',
      limit: 8
    });
    
    console.log('\n✅ Memory Context Retrieved Successfully:');
    console.log(`   📊 Memories found: ${result.memories.length}`);
    console.log(`   🕒 Search time: ${result.searchStats.searchTimeMs}ms`);
    console.log(`   🔍 Search provider: ${result.searchStats.provider}`);
    
    if (result.memories.length > 0) {
      console.log('\n💭 Found Memories:');
      result.memories.forEach((memory, index) => {
        console.log(`   ${index + 1}. ${memory.content}`);
        console.log(`      📈 Importance: ${memory.importance_score}/5`);
        console.log(`      🏷️  Tags: ${memory.tags?.join(', ') || 'None'}`);
      });
    } else {
      console.log('\n⚠️  No memories found - this is expected for a new user');
    }
    
    if (result.personalFacts.length > 0) {
      console.log('\n🎯 Personal Facts Extracted:');
      result.personalFacts.forEach(fact => {
        console.log(`   • ${fact}`);
      });
    }
    
    if (result.contextString) {
      console.log('\n📋 Generated Context String:');
      console.log(`   "${result.contextString.substring(0, 200)}..."`);
    }
    
    console.log('\n🎉 Memory System Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Memory System Test Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  }
}

// Test quick personal facts
async function testQuickPersonalFacts() {
  console.log('\n\n🔍 Testing Quick Personal Facts Retrieval...');
  console.log('=============================================');
  
  try {
    const facts = await memoryContextProvider.getQuickPersonalFacts(testUserId);
    
    console.log('✅ Quick Personal Facts Retrieved:');
    console.log(`   👤 Name: ${facts.name || 'Not found'}`);
    console.log(`   📚 Grade: ${facts.grade || 'Not found'}`);
    console.log(`   📖 Recent Topics: ${facts.recentTopics?.length || 0} found`);
    
  } catch (error) {
    console.error('❌ Quick Personal Facts Test Failed:');
    console.error(`   Error: ${error.message}`);
  }
}

// Test memory retrieval directly
async function testMemoryRetrieval() {
  console.log('\n\n🔄 Testing Direct Memory Retrieval...');
  console.log('====================================');
  
  try {
    const result = await memoryContextProvider.testMemoryRetrieval(testUserId, testQuery);
    
    console.log('✅ Memory Retrieval Test Result:');
    console.log(`   🟢 Success: ${result.success}`);
    console.log(`   📊 Memories Found: ${result.memoriesFound}`);
    console.log(`   📝 Context Length: ${result.context.length} characters`);
    
    if (result.error) {
      console.log(`   ⚠️  Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Memory Retrieval Test Failed:');
    console.error(`   Error: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Memory System Tests');
  console.log('=================================\n');
  
  await testMemorySystem();
  await testQuickPersonalFacts();
  await testMemoryRetrieval();
  
  console.log('\n\n🏁 All Tests Completed');
  console.log('========================\n');
  
  console.log('💡 Next Steps:');
  console.log('1. Make sure your database has the study_chat_memory table');
  console.log('2. Add some test memories with your user ID');
  console.log('3. Test the chat API to see if memories are retrieved');
  console.log('4. Try asking "Do you know my name?" in the chat\n');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testMemorySystem, testQuickPersonalFacts, testMemoryRetrieval, runAllTests };