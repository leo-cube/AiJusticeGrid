import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint to verify system status
 */
export async function GET(request: NextRequest) {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        frontend: 'operational',
        pdfGeneration: 'operational',
        pythonBackend: 'unknown'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasPythonBackendUrl: !!process.env.PYTHON_BACKEND_URL,
        pythonBackendUrl: process.env.PYTHON_BACKEND_URL ? 'configured' : 'not configured'
      }
    };

    // Test Python backend connectivity if URL is configured
    if (process.env.PYTHON_BACKEND_URL) {
      try {
        const pythonResponse = await fetch(`${process.env.PYTHON_BACKEND_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        healthStatus.services.pythonBackend = pythonResponse.ok ? 'operational' : 'error';
      } catch (error) {
        console.warn('Python backend health check failed:', error);
        healthStatus.services.pythonBackend = 'unreachable';
      }
    }

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to test PDF generation functionality
 */
export async function POST(request: NextRequest) {
  try {
    const testData = {
      title: 'Health Check PDF Test',
      analysisType: 'test',
      agentType: 'test',
      timestamp: new Date().toISOString(),
      messages: [
        {
          sender: 'user',
          content: 'This is a test message for PDF generation health check.',
          timestamp: new Date().toISOString()
        },
        {
          sender: 'ai',
          content: 'This is a test response from the AI agent.',
          timestamp: new Date().toISOString()
        }
      ],
      data: {
        testField: 'This is test data for PDF generation verification.'
      },
      userMetadata: {
        sessionId: 'health-check',
        userId: 'system',
        requestId: 'health-check-' + Date.now()
      }
    };

    // Test PDF generation
    const pdfResponse = await fetch(`${request.nextUrl.origin}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = {
      status: pdfResponse.ok ? 'success' : 'error',
      timestamp: new Date().toISOString(),
      pdfGeneration: {
        status: pdfResponse.ok ? 'operational' : 'error',
        statusCode: pdfResponse.status,
        contentType: pdfResponse.headers.get('content-type'),
        contentLength: pdfResponse.headers.get('content-length')
      }
    };

    if (!pdfResponse.ok) {
      const errorData = await pdfResponse.json().catch(() => ({ error: 'Unknown error' }));
      result.pdfGeneration = {
        ...result.pdfGeneration,
        error: errorData.error || 'PDF generation failed'
      };
    }

    return NextResponse.json(result, { 
      status: pdfResponse.ok ? 200 : 500 
    });
  } catch (error) {
    console.error('PDF generation health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        pdfGeneration: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
