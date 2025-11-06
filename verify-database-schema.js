#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * ==================================
 * 
 * Verifies all AI system database tables, indexes, RLS policies,
 * and extensions are properly configured.
 * 
 * Usage: node verify-database-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test results
const verificationResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  passed: 0,
  failed: 0
};

function logTest(testName, passed, message = '') {
  verificationResults.tests.push({
    test: testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (passed) {
    verificationResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    verificationResults.failed++;
    console.log(`❌ ${testName}: ${message}`);
  }
}

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verify pgvector extension
async function verifyVectorExtension() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: "SELECT * FROM pg_extension WHERE extname = 'vector';"
    });
    
    if (error) {
      logTest('Vector Extension', false, error.message);
      return;
    }
    
    const hasVector = data && data.length > 0;
    logTest('Vector Extension', hasVector, hasVector ? 'Enabled' : 'Not found');
    
  } catch (error) {
    logTest('Vector Extension', false, error.message);
  }
}

// Verify core AI tables exist
async function verifyAATables() {
  const tables = [
    'ai_suggestions',
    'student_profiles', 
    'suggestion_interactions',
    'suggestion_generation_logs',
    'file_analyses',
    'file_uploads',
    'analysis_study_plan_links'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}');`
      });
      
      const exists = data && data.length > 0 && data[0].exists;
      logTest(`Table: ${table}`, exists, exists ? 'Found' : 'Missing');
      
    } catch (error) {
      logTest(`Table: ${table}`, false, error.message);
    }
  }
}

// Verify RLS policies
async function verifyRLSPolicies() {
  const policies = [
    { table: 'ai_suggestions', policy: 'Users can view their own suggestions' },
    { table: 'ai_suggestions', policy: 'Users can insert their own suggestions' },
    { table: 'student_profiles', policy: 'Users can view their own student profile' },
    { table: 'file_analyses', policy: 'Users can view their own file analyses' },
    { table: 'file_analyses', policy: 'Users can insert their own file analyses' }
  ];
  
  for (const { table, policy } of policies) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `SELECT EXISTS (SELECT FROM pg_policies WHERE tablename = '${table}' AND policyname = '${policy}');`
      });
      
      const exists = data && data.length > 0 && data[0].exists;
      logTest(`RLS Policy: ${table}.${policy}`, exists, exists ? 'Found' : 'Missing');
      
    } catch (error) {
      logTest(`RLS Policy: ${table}.${policy}`, false, error.message);
    }
  }
}

// Verify indexes
async function verifyIndexes() {
  const indexes = [
    'idx_ai_suggestions_user_id',
    'idx_file_analyses_user_id',
    'idx_student_profiles_user_id',
    'idx_file_analyses_embedding'
  ];
  
  for (const index of indexes) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = '${index}');`
      });
      
      const exists = data && data.length > 0 && data[0].exists;
      logTest(`Index: ${index}`, exists, exists ? 'Found' : 'Missing');
      
    } catch (error) {
      logTest(`Index: ${index}`, false, error.message);
    }
  }
}

// Verify system prompts
async function verifySystemPrompts() {
  try {
    const { data, error } = await supabase
      .from('ai_system_prompts')
      .select('name, language, is_active')
      .limit(5);
    
    if (error) {
      logTest('System Prompts', false, error.message);
      return;
    }
    
    const hasPrompts = data && data.length > 0;
    logTest('System Prompts', hasPrompts, hasPrompts ? `Found ${data.length} prompts` : 'No prompts found');
    
    if (hasPrompts) {
      console.log('  Sample prompts:');
      data.forEach(prompt => {
        console.log(`    - ${prompt.name} (${prompt.language}) ${prompt.is_active ? '✓' : '✗'}`);
      });
    }
    
  } catch (error) {
    logTest('System Prompts', false, error.message);
  }
}

// Test database connectivity and basic operations
async function testDatabaseConnectivity() {
  try {
    // Test basic connectivity
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'SELECT NOW() as current_time;'
    });
    
    if (error) {
      logTest('Database Connectivity', false, error.message);
      return;
    }
    
    logTest('Database Connectivity', true, `Connected at ${data[0].current_time}`);
    
  } catch (error) {
    logTest('Database Connectivity', false, error.message);
  }
}

// Main verification process
async function runVerification() {
  console.clear();
  log('=====================================', 'blue');
  log('DATABASE SCHEMA VERIFICATION', 'white');
  log('=====================================', 'blue');
  console.log();
  
  const now = new Date();
  log(`Date: ${now.toLocaleDateString()}`, 'cyan');
  log(`Time: ${now.toLocaleTimeString()}`, 'cyan');
  console.log();
  
  // Run all verifications
  log('Running database verifications...', 'yellow');
  console.log();
  
  await testDatabaseConnectivity();
  await verifyVectorExtension();
  await verifyAATables();
  await verifyRLSPolicies();
  await verifyIndexes();
  await verifySystemPrompts();
  
  // Summary
  console.log();
  log('=====================================', 'blue');
  log('VERIFICATION SUMMARY', 'white');
  log('=====================================', 'blue');
  
  const successRate = Math.round((verificationResults.passed / verificationResults.tests.length) * 100);
  
  log(`Total tests run: ${verificationResults.tests.length}`, 'white');
  log(`Passed: ${verificationResults.passed}`, 'green');
  log(`Failed: ${verificationResults.failed}`, 'red');
  log(`Success rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (verificationResults.failed === 0) {
    console.log();
    log('🎉 All database components verified successfully!', 'green');
    log('Next step: Enhance AI Service Manager functionality', 'blue');
  } else {
    console.log();
    log('⚠️ Some database components need attention:', 'yellow');
    log('Review failed tests and fix missing components', 'yellow');
  }
  
  // Save results
  try {
    const logDir = 'logs';
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const logFileName = `logs/database-verification-${now.toISOString().split('T')[0]}.log`;
    
    let summaryText = `DATABASE SCHEMA VERIFICATION RESULTS
=====================================
Date: ${now.toLocaleDateString()}
Time: ${now.toLocaleTimeString()}

`;
    
    verificationResults.tests.forEach(test => {
      summaryText += `${test.passed ? '✅' : '❌'} ${test.test}: ${test.passed ? 'PASS' : 'FAIL'}
`;
      if (test.message) {
        summaryText += `    ${test.message}
`;
      }
      summaryText += '\n';
    });
    
    summaryText += `\nTotal tests: ${verificationResults.tests.length}
Passed: ${verificationResults.passed}
Failed: ${verificationResults.failed}
Success rate: ${successRate}%

`;
    
    fs.writeFileSync(logFileName, summaryText);
    log(`Results logged to: ${logFileName}`, 'cyan');
  } catch (error) {
    log(`Could not save log file: ${error.message}`, 'yellow');
  }
  
  console.log();
  process.exit(verificationResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.log('\nUnhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Execute verification
if (require.main === module) {
  runVerification().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runVerification };
