import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';
import fs from 'fs';
import path from 'path';

// Unified Agent Server URL
const UNIFIED_AGENT_SERVER_URL = process.env.NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL || 'http://localhost:5000';

// Path to agent settings file
const AGENT_SETTINGS_PATH = path.join(process.cwd(), 'data', 'agent-settings.json');

// Helper function to read agent settings from file
function readAgentSettings() {
  try {
    if (fs.existsSync(AGENT_SETTINGS_PATH)) {
      const fileContent = fs.readFileSync(AGENT_SETTINGS_PATH, 'utf8');
      const settings = JSON.parse(fileContent);
      return settings.enabledAgents || {};
    }
  } catch (error) {
    console.error('Error reading agent settings file:', error);
  }

  // Fallback to default settings
  return defaultSettings.enabledAgents || {};
}

// Helper function to write agent settings to file
function writeAgentSettings(enabledAgents: Record<string, boolean>) {
  try {
    const settings = {
      enabledAgents,
      lastUpdated: new Date().toISOString()
    };

    // Ensure data directory exists
    const dataDir = path.dirname(AGENT_SETTINGS_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(AGENT_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    console.log('Agent settings saved to file:', settings);
    return true;
  } catch (error) {
    console.error('Error writing agent settings file:', error);
    return false;
  }
}

/**
 * GET handler for retrieving enabled agents
 * Reads from local agent-settings.json file first, then tries unified server
 */
export async function GET() {
  try {
    console.log('GET /api/augment/toggle-agent - Fetching enabled agents');

    // First, try to read from local file
    const localAgentSettings = readAgentSettings();
    console.log('Local agent settings:', localAgentSettings);

    // Try to sync with unified server (optional)
    try {
      const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/api/augment/toggle-agent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Successfully fetched from unified server:', result);

        // If server has data, merge with local settings
        if (result.data && typeof result.data === 'object') {
          const mergedSettings = { ...localAgentSettings, ...result.data };
          writeAgentSettings(mergedSettings);

          return NextResponse.json({
            success: true,
            data: mergedSettings,
            message: "Fetched and synced with unified server"
          });
        }
      }
    } catch (serverError) {
      console.log('Unified server not available, using local settings');
    }

    // Return local settings
    return NextResponse.json({
      success: true,
      data: localAgentSettings,
      message: "Using local agent settings"
    });
  } catch (error) {
    console.error('Error fetching enabled agents:', error);

    // Final fallback to default settings
    const defaultEnabledAgents = defaultSettings.enabledAgents || {};

    return NextResponse.json({
      success: true,
      data: defaultEnabledAgents,
      message: "Error occurred, using default settings"
    });
  }
}

/**
 * POST handler for toggling an agent's enabled status
 * Updates local agent-settings.json file and optionally syncs with unified server
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.agentId || typeof body.enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: agentId and enabled'
      }, { status: 400 });
    }

    const { agentId, enabled } = body;
    console.log(`POST /api/augment/toggle-agent - Toggling agent ${agentId} to ${enabled}`);

    // Read current settings
    const currentSettings = readAgentSettings();

    // Update the specific agent
    const updatedSettings = {
      ...currentSettings,
      [agentId]: enabled
    };

    // Write to local file
    const fileSaved = writeAgentSettings(updatedSettings);

    if (!fileSaved) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save agent settings to file'
      }, { status: 500 });
    }

    // Try to sync with unified server (optional)
    let serverSynced = false;
    try {
      const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/api/augment/toggle-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Successfully synced with unified server:', result);
        serverSynced = true;
      }
    } catch (serverError) {
      console.log('Could not sync with unified server, but local file updated');
    }

    return NextResponse.json({
      success: true,
      agentId,
      enabled,
      data: updatedSettings,
      message: serverSynced
        ? "Agent toggled and synced with server"
        : "Agent toggled locally (server sync failed)"
    });
  } catch (error) {
    console.error('Error toggling agent:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * PUT handler for updating an agent's enabled status
 * Alternative endpoint for compatibility
 */
export async function PUT(request: Request) {
  return POST(request);
}

/**
 * PATCH handler for updating multiple agents at once
 * Updates local agent-settings.json file and optionally syncs with unified server
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.agents || typeof body.agents !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: agents (object)'
      }, { status: 400 });
    }

    console.log('PATCH /api/augment/toggle-agent - Updating multiple agents:', body.agents);

    // Read current settings
    const currentSettings = readAgentSettings();

    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...body.agents
    };

    // Write to local file
    const fileSaved = writeAgentSettings(updatedSettings);

    if (!fileSaved) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save agent settings to file'
      }, { status: 500 });
    }

    // Try to sync with unified server (optional)
    let serverSynced = false;
    try {
      const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/api/augment/update-agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Successfully synced with unified server:', result);
        serverSynced = true;
      }
    } catch (serverError) {
      console.log('Could not sync with unified server, but local file updated');
    }

    return NextResponse.json({
      success: true,
      agents: updatedSettings,
      data: updatedSettings,
      message: serverSynced
        ? "Agents updated and synced with server"
        : "Agents updated locally (server sync failed)"
    });
  } catch (error) {
    console.error('Error updating agents:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
