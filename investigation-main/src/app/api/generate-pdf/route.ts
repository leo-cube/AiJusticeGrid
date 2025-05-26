import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for generating PDF reports from chat conversations
 * Supports dynamic data extraction and AI-powered analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      );
    }

    // Enhanced data processing for chat-based PDF generation
    const pdfData = {
      title: body.title || 'AI Analysis Report',
      analysisType: body.analysisType || 'general',
      timestamp: new Date().toISOString(),
      data: body.data || {},
      messages: body.messages || [],
      agentType: body.agentType || 'general',
      includeAIAnalysis: body.includeAIAnalysis !== false,
      userMetadata: {
        sessionId: body.sessionId,
        userId: body.userId,
        requestId: body.requestId || Date.now().toString()
      }
    };

    // Extract data from chat messages if provided
    if (body.messages && body.messages.length > 0) {
      pdfData.data = { ...pdfData.data, ...extractDataFromMessages(body.messages) };
    }

    console.log('Generating PDF with data:', {
      title: pdfData.title,
      analysisType: pdfData.analysisType,
      dataKeys: Object.keys(pdfData.data),
      messageCount: pdfData.messages.length
    });

    // Forward the enhanced request to the Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${pythonBackendUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pdfData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate PDF' },
        { status: response.status }
      );
    }

    // Get the PDF data as a buffer
    const pdfBuffer = await response.arrayBuffer();

    // Get the filename from the response headers or create a default one
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'incident_report.pdf';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Return the PDF as a download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

/**
 * Extract structured data from chat messages
 */
function extractDataFromMessages(messages: any[]): Record<string, any> {
  const extractedData: Record<string, any> = {};

  // Look for patterns in user messages that contain data
  messages.forEach((message, index) => {
    if (message.sender === 'user') {
      const content = message.content.toLowerCase();

      // Extract case ID
      if (content.includes('case') && content.includes('id')) {
        const match = message.content.match(/case\s*id[:\s]*([^\s,]+)/i);
        if (match) extractedData.case_id = match[1];
      }

      // Extract dates
      if (content.includes('date') || content.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const dateMatch = message.content.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
        if (dateMatch) extractedData.date = dateMatch[1];
      }

      // Extract time
      if (content.includes('time') || content.match(/\d{1,2}:\d{2}/)) {
        const timeMatch = message.content.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) extractedData.time = timeMatch[1];
      }

      // Extract location
      if (content.includes('location') || content.includes('address') || content.includes('street')) {
        const locationMatch = message.content.match(/(?:location|address|street)[:\s]*(.+)/i);
        if (locationMatch) extractedData.location = locationMatch[1].trim();
      }

      // Extract names
      if (content.includes('name') && !content.includes('filename')) {
        const nameMatch = message.content.match(/name[:\s]*([^,\n]+)/i);
        if (nameMatch) extractedData.name = nameMatch[1].trim();
      }

      // Extract age
      if (content.includes('age') || content.match(/\b\d{1,3}\s*years?\s*old\b/)) {
        const ageMatch = message.content.match(/(?:age[:\s]*)?(\d{1,3})(?:\s*years?\s*old)?/i);
        if (ageMatch) extractedData.age = ageMatch[1];
      }

      // Store raw message content with index for reference
      extractedData[`message_${index + 1}`] = message.content;
    }
  });

  // Add conversation metadata
  extractedData.total_messages = messages.length;
  extractedData.user_messages = messages.filter(m => m.sender === 'user').length;
  extractedData.assistant_messages = messages.filter(m => m.sender === 'assistant').length;
  extractedData.conversation_start = messages[0]?.timestamp;
  extractedData.conversation_end = messages[messages.length - 1]?.timestamp;

  return extractedData;
}
