#!/usr/bin/env node

/**
 * Deployment Test Script for AI Justice Grid
 * This script performs basic smoke tests to ensure the application is ready for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AI Justice Grid - Deployment Test Suite');
console.log('==========================================\n');

let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (message) console.log(`   ${message}`);
  
  if (passed) testsPassed++;
  else testsFailed++;
}

// Test 1: Check if package.json exists and has required scripts
function testPackageJson() {
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = ['dev', 'build', 'start', 'lint'];
    const hasAllScripts = requiredScripts.every(script => packageJson.scripts[script]);
    
    logTest('Package.json configuration', hasAllScripts, 
      hasAllScripts ? 'All required scripts present' : 'Missing required scripts');
    
    return hasAllScripts;
  } catch (error) {
    logTest('Package.json configuration', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 2: Check if Next.js config exists
function testNextConfig() {
  const configExists = fs.existsSync(path.join(__dirname, 'next.config.ts'));
  logTest('Next.js configuration', configExists, 
    configExists ? 'next.config.ts found' : 'next.config.ts missing');
  return configExists;
}

// Test 3: Check if TypeScript config exists
function testTypeScriptConfig() {
  const configExists = fs.existsSync(path.join(__dirname, 'tsconfig.json'));
  logTest('TypeScript configuration', configExists,
    configExists ? 'tsconfig.json found' : 'tsconfig.json missing');
  return configExists;
}

// Test 4: Check if production environment file exists
function testProductionEnv() {
  const envExists = fs.existsSync(path.join(__dirname, '.env.production'));
  logTest('Production environment file', envExists,
    envExists ? '.env.production found' : '.env.production missing');
  return envExists;
}

// Test 5: Check if build directory exists (from previous build)
function testBuildOutput() {
  const buildExists = fs.existsSync(path.join(__dirname, '.next'));
  logTest('Build output', buildExists,
    buildExists ? 'Build directory exists' : 'No build directory (run npm run build)');
  return buildExists;
}

// Test 6: Check critical source files
function testSourceFiles() {
  const criticalFiles = [
    'src/app/layout.tsx',
    'src/app/(dashboard)/page.tsx',
    'src/app/globals.css',
    'src/app/types.ts'
  ];

  const allExist = criticalFiles.every(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    if (!exists) console.log(`   Missing: ${file}`);
    return exists;
  });

  logTest('Critical source files', allExist,
    allExist ? 'All critical files present' : 'Some critical files missing');
  return allExist;
}

// Test 7: Check if public directory has required assets
function testPublicAssets() {
  const publicDir = path.join(__dirname, 'public');
  const hasPublicDir = fs.existsSync(publicDir);
  
  if (!hasPublicDir) {
    logTest('Public assets', false, 'Public directory missing');
    return false;
  }
  
  const requiredAssets = ['next.svg', 'vercel.svg'];
  const hasAssets = requiredAssets.some(asset => 
    fs.existsSync(path.join(publicDir, asset))
  );
  
  logTest('Public assets', hasAssets,
    hasAssets ? 'Public assets found' : 'No public assets found');
  return hasAssets;
}

// Test 8: Check environment variables in production config
function testEnvironmentVariables() {
  try {
    const envPath = path.join(__dirname, '.env.production');
    if (!fs.existsSync(envPath)) {
      logTest('Environment variables', false, '.env.production not found');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'NEXT_PUBLIC_MURDER_AGENT_API_URL',
      'NEXTAUTH_URL',
      'NODE_ENV'
    ];
    
    const hasAllVars = requiredVars.every(varName => 
      envContent.includes(varName)
    );
    
    logTest('Environment variables', hasAllVars,
      hasAllVars ? 'Required environment variables configured' : 'Missing required environment variables');
    return hasAllVars;
  } catch (error) {
    logTest('Environment variables', false, `Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Running deployment readiness tests...\n');
  
  testPackageJson();
  testNextConfig();
  testTypeScriptConfig();
  testProductionEnv();
  testBuildOutput();
  testSourceFiles();
  testPublicAssets();
  testEnvironmentVariables();
  
  console.log('\n==========================================');
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Your application is ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Update environment variables with your actual API keys');
    console.log('2. Set NEXTAUTH_URL to your deployment domain');
    console.log('3. Deploy to Netlify using the build command: npm run build');
    console.log('4. Set publish directory to: .next');
  } else {
    console.log('⚠️  Some tests failed. Please address the issues before deployment.');
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run the tests
runTests();
