import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';
import fs from 'fs';
import path from 'path';

// File path for persistent storage
const STORAGE_FILE = path.join(process.cwd(), 'data', 'agent-settings.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load enabled agents from file or use defaults
const loadEnabledAgents = (): Record<string, boolean> => {
  try {
    ensureDataDirectory();

    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed.enabledAgents && typeof parsed.enabledAgents === 'object') {
        console.log('Loaded enabled agents from file:', parsed.enabledAgents);
        return parsed.enabledAgents;
      }
    }
  } catch (error) {
    console.error('Error loading enabled agents from file:', error);
  }

  // Fall back to default settings
  const defaultEnabledAgents: Record<string, boolean> = {};

  // Initialize enabled agents from default settings
  defaultSettings.agentTypes.forEach(agent => {
    defaultEnabledAgents[agent.id] = false;
  });

  // Use the default enabled agents configuration if available
  if (defaultSettings.enabledAgents && typeof defaultSettings.enabledAgents === 'object') {
    Object.assign(defaultEnabledAgents, defaultSettings.enabledAgents);
  }

  console.log('Using default enabled agents:', defaultEnabledAgents);
  return defaultEnabledAgents;
};

// Save enabled agents to file
const saveEnabledAgents = (enabledAgents: Record<string, boolean>) => {
  try {
    ensureDataDirectory();

    const data = {
      enabledAgents,
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    console.log('Saved enabled agents to file:', enabledAgents);
  } catch (error) {
    console.error('Error saving enabled agents to file:', error);
  }
};

// Load initial state
let enabledAgents: Record<string, boolean> = loadEnabledAgents();

/**
 * GET handler for agent status
 * Returns the enabled status of all agents
 */
export async function GET() {
  try {
    console.log('GET /api/agents/status - Returning enabled agents:', enabledAgents);
    return NextResponse.json(enabledAgents, { status: 200 });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent status' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating agent status
 * Updates the enabled status of a specific agent
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('PUT /api/agents/status - Request body:', body);

    // Validate request body
    if (!body.agentId || typeof body.enabled !== 'boolean') {
      console.error('Invalid request body:', body);
      return NextResponse.json(
        { error: 'Invalid request. Required fields: agentId, enabled' },
        { status: 400 }
      );
    }

    // Update agent status
    enabledAgents[body.agentId] = body.enabled;
    console.log(`Agent ${body.agentId} ${body.enabled ? 'enabled' : 'disabled'}`);

    // Save to persistent storage
    saveEnabledAgents(enabledAgents);

    return NextResponse.json(
      {
        agentId: body.agentId,
        enabled: body.enabled,
        message: `Agent ${body.agentId} ${body.enabled ? 'enabled' : 'disabled'} successfully`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating agent status:', error);
    return NextResponse.json(
      { error: 'Failed to update agent status' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for bulk updating agent status
 * Updates the enabled status of multiple agents
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log('PATCH /api/agents/status - Request body:', body);

    // Validate request body
    if (!body.agents || typeof body.agents !== 'object') {
      console.error('Invalid request body:', body);
      return NextResponse.json(
        { error: 'Invalid request. Required field: agents (object)' },
        { status: 400 }
      );
    }

    // Update agent statuses
    enabledAgents = {
      ...enabledAgents,
      ...body.agents
    };

    console.log('Updated agent statuses:', enabledAgents);

    // Save to persistent storage
    saveEnabledAgents(enabledAgents);

    return NextResponse.json(
      {
        agents: enabledAgents,
        message: 'Agent statuses updated successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating agent statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update agent statuses' },
      { status: 500 }
    );
  }
}
