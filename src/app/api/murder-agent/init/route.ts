import { NextResponse } from 'next/server';

// Murder Agent API URL
const MURDER_AGENT_API_URL = process.env.NEXT_PUBLIC_MURDER_AGENT_API_URL || 'http://localhost:5000/api/augment/murder';

/**
 * Initialize the Murder Agent backend
 * This endpoint is called when the Murder Agent is enabled in the settings
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request
    if (body.enabled !== true) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request. The Murder Agent must be enabled.'
      }, { status: 400 });
    }
    
    // Create a timeout to prevent hanging if the backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Try to connect to the Murder Agent backend
      const response = await fetch(`${MURDER_AGENT_API_URL.split('/api')[0]}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Murder Agent backend health check failed: ${response.statusText}`);
      }
      
      // Return success
      return NextResponse.json({
        success: true,
        message: 'Murder Agent backend initialized successfully',
        data: {
          backendUrl: MURDER_AGENT_API_URL,
          status: 'connected'
        }
      });
    } catch (error: any) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);
      
      console.error('Error connecting to Murder Agent backend:', error);
      
      // If the error is due to the timeout, return a specific message
      if (error.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Connection to Murder Agent backend timed out',
          data: {
            backendUrl: MURDER_AGENT_API_URL,
            status: 'timeout'
          }
        }, { status: 504 });
      }
      
      // Return a general error
      return NextResponse.json({
        success: false,
        error: `Failed to connect to Murder Agent backend: ${error.message}`,
        data: {
          backendUrl: MURDER_AGENT_API_URL,
          status: 'error'
        }
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Error processing Murder Agent initialization request:', error);
    
    return NextResponse.json({
      success: false,
      error: `Error processing request: ${error.message}`
    }, { status: 500 });
  }
}
