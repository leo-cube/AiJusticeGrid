import { NextResponse } from 'next/server';

// Murder Agent API URL
const MURDER_AGENT_API_URL = process.env.NEXT_PUBLIC_MURDER_AGENT_API_URL || 'http://localhost:5000/api/augment/murder/reset';

/**
 * Reset the Murder Agent conversation
 * This endpoint resets the conversation state for a session
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId;
    console.log('Resetting Murder Agent session:', sessionId);

    // Set a timeout for the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Call the Murder Agent reset API
      const response = await fetch(MURDER_AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Murder Agent reset API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Murder Agent reset response:', data);

      // Return the response
      return NextResponse.json({
        success: true,
        sessionId: data.session_id || null,
        data: data.data || null,
        message: 'Murder Agent session reset successfully'
      }, { status: 200 });
    } catch (error: any) {
      console.error('Error calling Murder Agent reset API:', error);
      
      // If the error is due to the timeout, return a specific message
      if (error.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Connection to the Murder Agent backend timed out',
          message: 'Failed to reset Murder Agent session'
        }, { status: 504 });
      }
      
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Failed to reset Murder Agent session'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error processing Murder Agent reset request:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to process Murder Agent reset request'
    }, { status: 500 });
  }
}
