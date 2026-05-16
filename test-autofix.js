/**
 * Test script to validate the auto_fix_code functionality
 */

const fs = require('fs');
const path = require('path');
const { autoFixCode } = require('./src/validator.js');

async function runTest() {
  console.log('='.repeat(80));
  console.log('DebugLens Auto-Fix Test');
  console.log('='.repeat(80));
  console.log();

  // Read the buggy code
  const buggyCodePath = path.join(__dirname, 'examples', 'buggy-code.js');
  const buggyCode = fs.readFileSync(buggyCodePath, 'utf-8');
  
  console.log('📄 Testing auto-fix on: examples/buggy-code.js');
  console.log('📁 Against repository: sample-repo/');
  console.log();
  console.log('-'.repeat(80));
  console.log();

  // Run auto-fix
  const repoPath = path.join(__dirname, 'sample-repo');
  
  try {
    const result = await autoFixCode(buggyCode, repoPath);
    
    // Display results
    console.log('✅ AUTO-FIX COMPLETE');
    console.log();
    console.log('📊 ISSUES FOUND:');
    console.log(JSON.stringify(result.issues_found, null, 2));
    console.log();
    console.log('='.repeat(80));
    console.log();
    
    // Summary
    console.log('📋 SUMMARY:');
    console.log(`   Issues Found: ${result.issues_found.length}`);
    console.log(`   Fixes Applied: ${result.fixes_applied.length}`);
    console.log();
    
    if (result.issues_found.length > 0) {
      console.log('⚠️  ISSUES DETECTED:');
      result.issues_found.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`      ${issue.description}`);
      });
      console.log();
    }
    
    if (result.fixes_applied.length > 0) {
      console.log('🔧 FIXES APPLIED:');
      result.fixes_applied.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
      console.log();
    }
    
    console.log('='.repeat(80));
    console.log();
    console.log('📝 FIXED CODE:');
    console.log('-'.repeat(80));
    console.log(result.fixed_code);
    console.log('-'.repeat(80));
    console.log();
    
    // Save fixed code to file
    const fixedCodePath = path.join(__dirname, 'examples', 'auto-fixed-code.js');
    fs.writeFileSync(fixedCodePath, result.fixed_code, 'utf-8');
    console.log(`💾 Fixed code saved to: ${fixedCodePath}`);
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