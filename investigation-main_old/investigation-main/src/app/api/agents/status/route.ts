import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

// In a real application, this would be stored in a database
let enabledAgents: Record<string, boolean> = {};

// Initialize enabled agents from default settings
defaultSettings.agentTypes.forEach(agent => {
  enabledAgents[agent.id] = false;
});

// All agents are disabled by default
// If there's a default enabledAgents configuration, use it
if (defaultSettings.enabledAgents && typeof defaultSettings.enabledAgents === 'object') {
  // Use the default enabled agents configuration
  enabledAgents = {
    ...enabledAgents,
    ...defaultSettings.enabledAgents
  };
}

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
