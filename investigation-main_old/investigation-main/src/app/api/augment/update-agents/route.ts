import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

// Unified Agent Server URL
const UNIFIED_AGENT_SERVER_URL = process.env.NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL || 'http://localhost:5000';

/**
 * POST handler for updating multiple agent statuses at once
 * Proxies the request to the unified agent server
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.agents || typeof body.agents !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: agents (object)'
      }, { status: 400 });
    }
    
    console.log('POST /api/augment/update-agents - Updating agent statuses:', body.agents);
    
    // Make a request to the unified agent server
    const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/api/augment/update-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      console.error(`Error updating agents on unified server: ${response.status} ${response.statusText}`);
      
      // Return an error response
      return NextResponse.json({
        success: false,
        error: `Failed to update agents: ${response.statusText}`
      }, { status: response.status });
    }
    
    // Parse the response
    const result = await response.json();
    
    console.log('Successfully updated agents on unified server:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating agents:', error);
    
    // Return an error response
    return NextResponse.json({
      success: false,
      error: 'Failed to update agents'
    }, { status: 500 });
  }
}
