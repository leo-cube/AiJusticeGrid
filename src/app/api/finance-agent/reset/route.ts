import { NextResponse } from 'next/server';

// Finance Agent API URL
const FINANCE_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCE_AGENT_API_URL || 'http://localhost:5000/api/augment/finance/reset';

/**
 * Reset the Finance Agent conversation
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

    console.log('Resetting Finance Agent conversation for session:', body.sessionId);

    // Create a timeout to prevent hanging if the backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Call the Finance Agent reset endpoint
      const response = await fetch(FINANCE_AGENT_API_URL, {
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
          message: 'Finance Agent conversation reset successfully',
          sessionId: body.sessionId,
          data: data
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Finance Agent reset failed with status ${response.status}: ${response.statusText}`,
          sessionId: body.sessionId
        }, { status: response.status });
      }

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Finance Agent reset request timed out',
          sessionId: body.sessionId
        }, { status: 408 });
      }

      return NextResponse.json({
        success: false,
        error: `Failed to reset Finance Agent conversation: ${fetchError.message}`,
        sessionId: body.sessionId
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error resetting Finance Agent conversation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reset Finance Agent conversation'
    }, { status: 500 });
  }
}
