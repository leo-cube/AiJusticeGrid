import { NextResponse } from 'next/server';

// Murder Agent API URL
const MURDER_AGENT_API_URL = process.env.NEXT_PUBLIC_MURDER_AGENT_API_URL || 'http://127.0.0.1:5000/api/augment/murder';

/**
 * Check if the Murder Agent backend is available
 * This is a proxy endpoint to avoid CORS issues
 */
export async function GET() {
  try {
    console.log('Checking Murder Agent backend via proxy at:', MURDER_AGENT_API_URL);

    try {
      const response = await fetch(MURDER_AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'ping',
          additional_notes: 'This is a ping to check if the Murder Agent API is running.'
        }),
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      const isAvailable = response.ok;
      console.log('Murder Agent backend available (via proxy):', isAvailable);

      return NextResponse.json({
        available: isAvailable,
        message: isAvailable ? 'Murder Agent backend is available' : 'Murder Agent backend is not available'
      });
    } catch (fetchError) {
      console.error('Error fetching Murder Agent backend via proxy:', fetchError);
      
      // If we get a fetch error, it might be due to network issues
      // Let's check if we can see the server in the logs
      return NextResponse.json({
        available: false,
        message: 'Error connecting to Murder Agent backend',
        error: fetchError.message
      });
    }
  } catch (error) {
    console.error('Error in Murder Agent backend check proxy:', error);
    return NextResponse.json({
      available: false,
      message: 'Error in Murder Agent backend check proxy',
      error: error.message
    }, { status: 500 });
  }
}
