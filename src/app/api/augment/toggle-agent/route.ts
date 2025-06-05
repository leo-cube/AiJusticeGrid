import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

// Unified Agent Server URL
const UNIFIED_AGENT_SERVER_URL = process.env.NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL || 'http://localhost:5000';

/**
 * GET handler for retrieving enabled agents
 * Proxies the request to the unified agent server
 */
export async function GET() {
  try {
    console.log('GET /api/augment/toggle-agent - Fetching enabled agents from unified server');

    // Make a request to the unified agent server
    const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/api/augment/toggle-agent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Error fetching enabled agents from unified server: ${response.status} ${response.statusText}`);

      // Return a fallback response with default settings
      const defaultEnabledAgents = defaultSettings.enabledAgents || {};

      return NextResponse.json({
        success: true,
        data: defaultEnabledAgents,
        message: "Failed to fetch enabled agents from unified server, using defaults"
      });
    }

    // Parse the response
    const result = await response.json();

    console.log('Successfully fetched enabled agents from unified server:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching enabled agents:', error);

    // Return a fallback response with default settings
    const defaultEnabledAgents = defaultSettings.enabledAgents || {};

    return NextResponse.json({
      success: true,
      data: defaultEnabledAgents,
      message: "Error fetching enabled agents, using defaults"
    });
  }
}

/**
 * POST handler for toggling an agent's enabled status
 * Proxies the request to the unified agent server
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

    // Make a request to the unified agent server
    const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/api/augment/toggle-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Error toggling agent on unified server: ${response.status} ${response.statusText}`);

      // Return an error response
      return NextResponse.json({
        success: false,
        error: `Failed to toggle agent: ${response.statusText}`
      }, { status: response.status });
    }

    // Parse the response
    const result = await response.json();

    console.log('Successfully toggled agent on unified server:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error toggling agent:', error);

    // Return an error response
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle agent'
    }, { status: 500 });
  }
}
