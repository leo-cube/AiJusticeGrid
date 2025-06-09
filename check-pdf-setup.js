#!/usr/bin/env node

/**
 * PDF Generation Setup Checker
 * 
 * This script helps verify that PDF generation is properly configured
 * for deployment. Run this before deploying to production.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AI Justice Grid - PDF Generation Setup Checker\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Verify jsPDF dependency
console.log('1. Checking jsPDF dependency...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.dependencies && packageJson.dependencies.jspdf) {
    console.log('   ✅ jsPDF found in dependencies:', packageJson.dependencies.jspdf);
  } else {
    console.log('   ❌ jsPDF not found in dependencies');
    console.log('   💡 Run: npm install jspdf@^3.0.1');
    hasErrors = true;
  }
} catch (error) {
  console.log('   ❌ Could not read package.json');
  hasErrors = true;
}

// Check 2: Verify PDF generation API route exists
console.log('\n2. Checking PDF generation API route...');
const pdfRouteFile = 'src/app/api/generate-pdf/route.ts';
if (fs.existsSync(pdfRouteFile)) {
  console.log('   ✅ PDF generation route found');
  
  // Check if it has the fallback functionality
  const routeContent = fs.readFileSync(pdfRouteFile, 'utf8');
  if (routeContent.includes('generateClientSidePDF')) {
    console.log('   ✅ Client-side fallback functionality detected');
  } else {
    console.log('   ⚠️  Client-side fallback not detected');
    console.log('   💡 Consider updating to the latest PDF generation code');
    hasWarnings = true;
  }
} else {
  console.log('   ❌ PDF generation route not found');
  hasErrors = true;
}

// Check 3: Verify health check endpoint
console.log('\n3. Checking health check endpoint...');
const healthRouteFile = 'src/app/api/health/route.ts';
if (fs.existsSync(healthRouteFile)) {
  console.log('   ✅ Health check endpoint found');
} else {
  console.log('   ⚠️  Health check endpoint not found');
  console.log('   💡 Health check helps diagnose PDF issues in production');
  hasWarnings = true;
}

// Check 4: Environment configuration
console.log('\n4. Checking environment configuration...');
const envExampleFile = '.env.example';
if (fs.existsSync(envExampleFile)) {
  const envContent = fs.readFileSync(envExampleFile, 'utf8');
  if (envContent.includes('PYTHON_BACKEND_URL')) {
    console.log('   ✅ Environment template includes PDF backend configuration');
  } else {
    console.log('   ⚠️  Environment template missing PDF backend configuration');
    hasWarnings = true;
  }
} else {
  console.log('   ⚠️  .env.example file not found');
  hasWarnings = true;
}

// Check 5: PDF utility functions
console.log('\n5. Checking PDF utility functions...');
const pdfUtilFile = 'src/utils/pdfGenerator.ts';
if (fs.existsSync(pdfUtilFile)) {
  console.log('   ✅ PDF utility functions found');
} else {
  console.log('   ⚠️  PDF utility functions not found');
  console.log('   💡 These provide client-side PDF generation capabilities');
  hasWarnings = true;
}

// Check 6: Component integration
console.log('\n6. Checking PDF generation components...');
const components = [
  'src/app/components/chat/PDFGenerationButton.tsx',
  'src/app/components/chat/DownloadReportButton.tsx'
];

let componentCount = 0;
components.forEach(component => {
  if (fs.existsSync(component)) {
    componentCount++;
  }
});

if (componentCount > 0) {
  console.log(`   ✅ Found ${componentCount} PDF generation components`);
} else {
  console.log('   ⚠️  No PDF generation components found');
  hasWarnings = true;
}

// Summary
console.log('\n📋 Summary:');
if (hasErrors) {
  console.log('❌ Setup has ERRORS that must be fixed before deployment');
  console.log('   Please address the issues marked with ❌ above');
} else if (hasWarnings) {
  console.log('⚠️  Setup has warnings but should work in production');
  console.log('   Consider addressing the issues marked with ⚠️ for better reliability');
} else {
  console.log('✅ PDF generation setup looks good!');
}

// Deployment recommendations
console.log('\n🚀 Deployment Recommendations:');
console.log('1. Set environment variables in your hosting platform:');
console.log('   - PYTHON_BACKEND_URL (optional - leave empty for client-side only)');
console.log('   - Other required environment variables from .env.example');
console.log('');
console.log('2. Test PDF generation after deployment:');
console.log('   - Visit: https://your-domain.com/api/health');
console.log('   - Try generating a PDF from the application');
console.log('');
console.log('3. Monitor for issues:');
console.log('   - Check browser console for errors');
console.log('   - Monitor health check endpoint');
console.log('   - Set up alerts for PDF generation failures');

// Exit with appropriate code
process.exit(hasErrors ? 1 : 0);
