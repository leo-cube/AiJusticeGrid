#!/usr/bin/env node

/**
 * Test script to verify backend connection and PDF generation
 * Run this with: node test-backend-connection.js
 */

const https = require('https');

// Test configuration
const BACKEND_URL = 'https://aijusticegrid.onrender.com';
const TEST_ENDPOINTS = [
  '/health',
  '/api/generate-pdf'
];

// Sample PDF generation data
const samplePDFData = {
  title: "Test Murder Investigation Report",
  analysisType: "murder",
  agentType: "murder",
  timestamp: new Date().toISOString(),
  data: {
    case_id: "TEST-001",
    crime_date: "2024-01-15",
    crime_time: "10:30 PM",
    location: "123 Test Street, Test City",
    victim_name: "Test Victim",
    victim_age: "30",
    victim_gender: "Male",
    cause_of_death: "Test cause",
    weapon_used: "Test weapon",
    crime_scene_description: "Test crime scene description",
    witnesses: "Test witnesses",
    evidence_found: "Test evidence",
    suspects: "Test suspects",
    additional_notes: "Test additional notes"
  },
  messages: [
    {
      sender: "assistant",
      content: "What is the case ID for this investigation?",
      agentType: "murder",
      timestamp: new Date().toISOString()
    },
    {
      sender: "user",
      content: "TEST-001",
      timestamp: new Date().toISOString()
    }
  ],
  includeAIAnalysis: true,
  userMetadata: {
    sessionId: "test-session",
    userId: "test-user",
    requestId: "test-request"
  }
};

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Backend-Test-Script/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testBackendConnection() {
  console.log('🧪 Testing Backend Connection and PDF Generation');
  console.log('=' .repeat(60));
  
  // Test 1: Check if backend is accessible
  console.log('\n1. Testing backend accessibility...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/`);
    console.log(`✅ Backend accessible - Status: ${response.statusCode}`);
  } catch (error) {
    console.log(`❌ Backend not accessible - Error: ${error.message}`);
    return;
  }

  // Test 2: Check health endpoint (if it exists)
  console.log('\n2. Testing health endpoint...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    console.log(`✅ Health endpoint - Status: ${response.statusCode}`);
    if (response.statusCode === 200) {
      console.log(`   Response: ${response.data.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`⚠️  Health endpoint not available - ${error.message}`);
  }

  // Test 3: Test PDF generation endpoint
  console.log('\n3. Testing PDF generation endpoint...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/generate-pdf`, 'POST', samplePDFData);
    console.log(`📄 PDF Generation - Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];
      console.log(`✅ PDF generated successfully!`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
    } else {
      console.log(`❌ PDF generation failed`);
      console.log(`   Response: ${response.data.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`❌ PDF generation error - ${error.message}`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Backend connection test completed');
}

// Run the test
testBackendConnection().catch(console.error);
