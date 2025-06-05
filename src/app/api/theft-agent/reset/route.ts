import { NextResponse } from 'next/server';

// Theft Agent API URL
const THEFT_AGENT_API_URL = process.env.NEXT_PUBLIC_THEFT_AGENT_API_URL || 'http://localhost:5001/api/augment/theft/reset';

/**
 * Reset the Theft Agent conversation
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

    console.log('Resetting Theft Agent conversation for session:', body.sessionId);

    // Create a timeout to prevent hanging if the backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Call the Theft Agent reset endpoint
      const response = await fetch(THEFT_AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: body.sessionId,
          action: 'reset'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        return NextResponse.json({
          success: true,
          message: 'Theft Agent conversation reset successfully',
          sessionId: body.sessionId,
          data: data
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Theft Agent reset failed with status ${response.status}: ${response.statusText}`,
          sessionId: body.sessionId
        }, { status: response.status });
      }

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Theft Agent reset request timed out',
          sessionId: body.sessionId
        }, { status: 408 });
      }

      return NextResponse.json({
        success: false,
        error: `Failed to reset Theft Agent conversation: ${fetchError.message}`,
        sessionId: body.sessionId
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error resetting Theft Agent conversation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reset Theft Agent conversation'
    }, { status: 500 });
  }
}
