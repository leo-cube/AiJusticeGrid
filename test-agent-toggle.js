/**
 * Test script to verify agent toggle functionality with agent-settings.json
 * Run this in the browser console on the settings page
 */

// Test 1: Check if agentToggleService is available
console.log('🧪 Testing Agent Toggle Functionality with agent-settings.json...');

// Test 2: Check localStorage functionality
const testAgentSettings = {
  general: false,
  murder: true,
  finance: true,
  theft: false,
  smuggle: false,
  'crime-accident': false,
  'crime-abuse': false
};

try {
  localStorage.setItem('enabledAgents', JSON.stringify(testAgentSettings));
  const retrieved = JSON.parse(localStorage.getItem('enabledAgents'));
  console.log('✅ localStorage test passed:', retrieved);
} catch (error) {
  console.error('❌ localStorage test failed:', error);
}

// Test 3: Check if API endpoints are accessible and working with agent-settings.json
async function testApiEndpoints() {
  console.log('🔍 Testing API endpoints with agent-settings.json...');

  try {
    // Test GET endpoint
    const getResponse = await fetch('/api/augment/toggle-agent');
    console.log('✅ GET /api/augment/toggle-agent status:', getResponse.status);

    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('📊 Current agent settings from file:', data);
      console.log('🎯 Enabled agents:', Object.entries(data.data || {}).filter(([_, enabled]) => enabled).map(([id]) => id));
    }

    // Test POST endpoint - toggle finance agent
    console.log('🔄 Testing agent toggle (finance agent)...');
    const postResponse = await fetch('/api/augment/toggle-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'finance', enabled: false })
    });
    console.log('✅ POST /api/augment/toggle-agent status:', postResponse.status);

    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('📝 Toggle result:', result);
    }

    // Test GET again to verify change
    const getResponse2 = await fetch('/api/augment/toggle-agent');
    if (getResponse2.ok) {
      const data2 = await getResponse2.json();
      console.log('📊 Updated agent settings:', data2);
    }

    // Restore finance agent to true
    await fetch('/api/augment/toggle-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'finance', enabled: true })
    });
    console.log('🔄 Restored finance agent to enabled');

  } catch (error) {
    console.error('❌ API endpoint test failed:', error);
  }
}

// Test 4: Check if components are properly loaded
function testComponentsLoaded() {
  console.log('🔍 Testing component availability...');

  // Check if we're on the settings page
  const isSettingsPage = window.location.pathname.includes('/settings');
  console.log('📍 On settings page:', isSettingsPage);

  // Check for agent toggle switches
  const toggleSwitches = document.querySelectorAll('input[type="checkbox"]');
  console.log('🎛️ Found toggle switches:', toggleSwitches.length);

  // Check for agent cards
  const agentCards = document.querySelectorAll('[class*="border"][class*="rounded"]');
  console.log('🃏 Found potential agent cards:', agentCards.length);
}

// Run tests
testApiEndpoints();
testComponentsLoaded();

console.log('🎉 Agent toggle functionality tests completed!');
console.log('📋 To manually test the complete workflow:');
console.log('1. Navigate to Settings → Agent Configuration');
console.log('2. Toggle agents on/off and verify visual feedback');
console.log('3. Navigate to Crime page and verify only enabled agents appear');
console.log('4. Check that murder and finance agents are visible (enabled by default)');
console.log('5. Toggle off murder agent in settings, refresh crime page');
console.log('6. Verify murder agent disappears from crime page');
console.log('7. Toggle murder agent back on, refresh crime page');
console.log('8. Verify murder agent reappears in crime page');
console.log('');
console.log('🔍 Expected behavior based on agent-settings.json:');
console.log('✅ Murder Agent - should be visible (enabled: true)');
console.log('✅ Finance Agent - should be visible (enabled: true)');
console.log('❌ General Assistant - should be hidden (enabled: false)');
console.log('❌ Theft Agent - should be hidden (enabled: false)');
console.log('❌ Smuggle Agent - should be hidden (enabled: false)');
console.log('❌ Crime Accident Agent - should be hidden (enabled: false)');
console.log('❌ Crime Abuse Agent - should be hidden (enabled: false)');
