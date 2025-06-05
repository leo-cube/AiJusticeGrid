import { NextResponse } from 'next/server';

// Finance Agent API URL
const FINANCE_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCE_AGENT_API_URL || 'http://127.0.0.1:5000/api/augment/finance';

/**
 * Check if the Finance Agent backend is available
 * This is a proxy endpoint to avoid CORS issues
 */
export async function GET() {
  try {
    console.log('Checking Finance Agent backend via proxy at:', FINANCE_AGENT_API_URL);
    
    // Create a timeout to prevent hanging if the backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for health check
    
    try {
      // Test the Finance Agent backend with a simple ping
      const response = await fetch(FINANCE_AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'ping',
          additional_notes: 'Health check from Finance Agent proxy'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Finance Agent backend is available:', data);
        
        return NextResponse.json({
          available: true,
          status: 'healthy',
          message: 'Finance Agent backend is running',
          backend_response: data
        });
      } else {
        console.log('Finance Agent backend returned error status:', response.status, response.statusText);
        
        return NextResponse.json({
          available: false,
          status: 'error',
          message: `Finance Agent backend returned status ${response.status}: ${response.statusText}`
        });
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Finance Agent backend health check timed out');
        return NextResponse.json({
          available: false,
          status: 'timeout',
          message: 'Finance Agent backend health check timed out'
        });
      }
      
      console.log('Finance Agent backend is not available:', fetchError.message);
      return NextResponse.json({
        available: false,
        status: 'unavailable',
        message: `Finance Agent backend is not available: ${fetchError.message}`
      });
    }
    
  } catch (error) {
    console.error('Error checking Finance Agent backend:', error);
    return NextResponse.json({
      available: false,
      status: 'error',
      message: 'Failed to check Finance Agent backend status'
    }, { status: 500 });
  }
}
