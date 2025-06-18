import { NextResponse } from 'next/server';

// Environment variables
const AUGMENT_AI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AUGMENT_AI === 'true';
const AUGMENT_AI_API_KEY = process.env.NEXT_PUBLIC_AUGMENT_AI_API_KEY;

/**
 * POST handler for Augment AI requests
 */
export async function POST(request: Request) {
  try {
    // Check if Augment AI is enabled
    if (!AUGMENT_AI_ENABLED) {
      return NextResponse.json({
        success: false,
        error: 'Augment AI is not enabled'
      }, { status: 403 });
    }

    // Check if API key is configured
    if (!AUGMENT_AI_API_KEY || AUGMENT_AI_API_KEY === 'your-augment-ai-api-key-here') {
      return NextResponse.json({
        success: false,
        error: 'Augment AI API key is not configured'
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: message'
      }, { status: 400 });
    }

    console.log('POST /api/augment-ai - Processing request:', body);

    // For now, return a mock response
    // In a real implementation, this would call the actual Augment AI service
    const mockResponse = {
      success: true,
      data: {
        response: `Augment AI processed your message: "${body.message}". This is a mock response for development.`,
        confidence: 0.95,
        suggestions: [
          'Consider investigating financial records',
          'Check for witness statements',
          'Review security footage'
        ]
      },
      message: 'Request processed successfully'
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error processing Augment AI request:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET handler for Augment AI status
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        enabled: AUGMENT_AI_ENABLED,
        configured: AUGMENT_AI_API_KEY && AUGMENT_AI_API_KEY !== 'your-augment-ai-api-key-here'
      },
      message: 'Augment AI status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting Augment AI status:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
