/**
 * Test script to validate the buggy code against the sample repository
 */

const fs = require('fs');
const path = require('path');
const { validateCode } = require('./src/validator.js');

async function runTest() {
  console.log('='.repeat(80));
  console.log('DebugLens Validation Test');
  console.log('='.repeat(80));
  console.log();

  // Read the buggy code
  const buggyCodePath = path.join(__dirname, 'examples', 'buggy-code.js');
  const buggyCode = fs.readFileSync(buggyCodePath, 'utf-8');
  
  console.log('📄 Testing AI-generated code from: examples/buggy-code.js');
  console.log('📁 Against repository: sample-repo/');
  console.log();
  console.log('-'.repeat(80));
  console.log();

  // Run validation
  const repoPath = path.join(__dirname, 'sample-repo');
  
  try {
    const result = await validateCode(buggyCode, repoPath);
    
    // Display results
    console.log('✅ VALIDATION COMPLETE');
    console.log();
    console.log('📊 VALIDATION RESULTS:');
    console.log(JSON.stringify(result, null, 2));
    console.log();
    console.log('='.repeat(80));
    
    // Summary
    console.log();
    console.log('📋 SUMMARY:');
    console.log(`   Files Analyzed: ${result.patterns_found.files_analyzed}`);
    console.log(`   Issues Found: ${result.issues.length}`);
    console.log();
    
    if (result.issues.length > 0) {
      console.log('⚠️  ISSUES DETECTED:');
      result.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`      ${issue.description}`);
      });
      console.log();
    }
    
    console.log('💡 SUGGESTION:');
    console.log(`   ${result.suggestion}`);
    console.log();
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runTest().catch(console.error);

// Made with Bob
