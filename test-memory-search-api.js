const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = 'https://oeqgzkwzxcpowgsfntuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWdreHp6eGNwb3dnc2ZudHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MzE1MjAsImV4cCI6MjA1MDQwNzUyMH0.sJAnLPnxXKlLLyPFbZJaECpAEDQvd3k9gLKw6vPG6iM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMemorySearchAPI() {
  console.log('🔍 TESTING MEMORY SEARCH API ENDPOINT');
  console.log('======================================\n');

  const testUserId = 'memory-search-test-1762702150000';

  try {
    // Step 1: First, manually store a memory directly in database
    console.log('🗄️ Step 1: Manually storing memory in database...');
    const { data: storedMemory, error: storeError } = await supabase
      .from('conversation_memory')
      .insert({
        user_id: testUserId,
        conversation_id: 'test-conv-search-123',
        interaction_data: {
          content: 'My name is Kunal',
          tags: ['personal', 'identity'],
          importance: 'high'
        },
        quality_score: 0.9,
        memory_relevance_score: 0.95
      })
      .select()
      .single();

    if (storeError) {
      console.log('❌ Failed to store memory:', storeError);
    } else {
      console.log('✅ Memory stored successfully:', storedMemory?.id);
    }
    console.log('');

    // Step 2: Test the new memory search API endpoint
    console.log('🔍 Step 2: Testing memory search API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/memory/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        query: 'Do you know my name?',
        chatType: 'study_assistant',
        isPersonalQuery: true,
        contextLevel: 'comprehensive',
        limit: 8
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    console.log('');

    // Step 3: Check if memories were found
    console.log('📊 Step 3: Analysis...');
    const memoriesFound = result.data?.memories?.length || 0;
    const contextLength = result.data?.contextString?.length || 0;
    
    console.log('Memories found:', memoriesFound);
    console.log('Context string length:', contextLength);
    console.log('Personal facts found:', result.data?.personalFacts?.length || 0);
    
    if (memoriesFound > 0 && contextLength > 0) {
      console.log('✅ SUCCESS: Memory search API is working!');
      console.log('Sample memory content:', result.data.memories[0]?.content);
      console.log('Sample context:', result.data.contextString.substring(0, 200) + '...');
    } else {
      console.log('❌ FAILURE: Memory search API not finding memories');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Start the test
testMemorySearchAPI();