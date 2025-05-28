import { NextResponse } from 'next/server';

// Finance Agent API URL
const FINANCE_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCE_AGENT_API_URL || 'http://localhost:5000/api/augment/finance';

/**
 * Initialize the Finance Agent backend
 * This endpoint is called when the Finance Agent is enabled in the settings
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request
    if (body.enabled !== true) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request. The Finance Agent must be enabled.'
      }, { status: 400 });
    }
    
    // Create a timeout to prevent hanging if the backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Test the Finance Agent backend with a ping
      const response = await fetch(FINANCE_AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'ping',
          additional_notes: 'Finance Agent initialization test'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        return NextResponse.json({
          success: true,
          message: 'Finance Agent initialized successfully',
          data: {
            status: 'healthy',
            backend_response: data
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Finance Agent backend returned status ${response.status}: ${response.statusText}`
        }, { status: 503 });
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Finance Agent backend initialization timed out'
        }, { status: 408 });
      }
      
      return NextResponse.json({
        success: false,
        error: `Failed to connect to Finance Agent backend: ${fetchError.message}`
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Error initializing Finance Agent:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize Finance Agent'
    }, { status: 500 });
  }
}
