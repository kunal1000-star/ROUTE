// Test database connection and identify potential issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mrhpsmyhquvygenyhygf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaHBzbXlocXV2eWdlbnloeWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTYwNTksImV4cCI6MjA3NjE5MjA1OX0.K0EyXnx2ORtmkjcZew3I833j5Wb_ITI5QO1zc1dURzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('subjects')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ Database connection working');
  } else {
    console.log('❌ Database connection failed');
  }
});
