import { NextResponse } from 'next/server';
import { ChatContext } from '@/app/types';

// Finance Agent API URL
const FINANCE_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCE_AGENT_API_URL || 'http://localhost:5000/api/augment/finance';

/**
 * Direct proxy to the Finance Agent backend
 * This avoids CORS issues when calling from the frontend
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.question) {
      return NextResponse.json(
        { error: 'Missing required field: question' },
        { status: 400 }
      );
    }

    const question = body.question;
    const context = body.context as ChatContext;

    // Get the session ID if available
    let sessionId = body.sessionId;

    // Check if the sessionId is "new session" (a string literal) and set it to null
    if (sessionId === 'new session') {
      console.log('Received "new session" as session ID, setting to null to create a new session');
      sessionId = null;
    }

    console.log('Finance Agent Direct API called with:', {
      question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
      sessionId,
      hasContext: !!context
    });

    // Handle special commands
    if (question === 'FORCE_NEW_SESSION' || body.forceReset) {
      console.log('Forcing new session for Finance Agent');
      sessionId = null;
    }

    // Create case details object from context and question
    let caseDetails: any = {};

    // If we have a context, use it to build case details
    if (context) {
      caseDetails = {
        case_id: context.caseId || `case_${Date.now()}`,
        date_of_incident: context.crimeDate || new Date().toISOString().split('T')[0],
        time_of_discovery: context.crimeTime || "Unknown",
        financial_institution: context.location || "Unknown",
        victim_name: context.victimName || "Unknown",
        account_type: context.victimAge || "Unknown",
        account_number: context.victimGender || "Unknown",
        fraud_type: context.causeOfDeath || "Unknown",
        amount_involved: context.weaponUsed || "Unknown",
        method_used: context.crimeSceneDescription || "Unknown",
        suspicious_activity: context.suspects || "Unknown",
        evidence_collected: context.evidenceFound || "Unknown",
        suspects: context.witnesses || "Unknown",
        additional_notes: context.additionalNotes || question
      };
    }

    // Handle different types of questions
    if (question.toLowerCase().includes('ping') || question === 'ping') {
      caseDetails = {
        question: 'ping',
        additional_notes: 'This is a ping to check if the Finance Agent API is running.'
      };
    } else if (question === 'FORCE_NEW_SESSION') {
      // This is a session initialization request
      caseDetails = {
        question: 'Please start a new financial fraud investigation. What is the case ID?',
        session_init: true
      };
    } else if (question.length < 50 && !context) {
      // This looks like a direct question rather than case data
      caseDetails = {
        question: question,
        additional_notes: context?.additionalNotes || ''
      };
    } else {
      // This is likely case data or a continuation of the conversation
      if (!context) {
        // If no context, treat the question as additional notes
        caseDetails.additional_notes = question;
      } else {
        // Update the additional notes with the current question
        caseDetails.additional_notes = (caseDetails.additional_notes || '') + '\n' + question;
      }
    }

    // Add session ID if available
    if (sessionId) {
      caseDetails.session_id = sessionId;
    }

    // Add any additional context information
    if (context?.additionalNotes) {
      caseDetails.additional_notes = (caseDetails.additional_notes || '') + '\n' + context.additionalNotes;
    }

    // Clean up empty fields
    Object.keys(caseDetails).forEach(key => {
      if (caseDetails[key] === "Unknown" || caseDetails[key] === "" || caseDetails[key] === null) {
        delete caseDetails[key];
      }
    });

    // Important: Do NOT set case_id for regular messages
    // The backend will handle the first user message as the case ID

    console.log('Sending case details to Finance Agent:', JSON.stringify(caseDetails));

    console.log('Calling Finance Agent backend directly from Next.js API route:', FINANCE_AGENT_API_URL);

    // Set a timeout for the API call (60 seconds for analysis generation)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      // Call the Finance Agent API directly
      const response = await fetch(FINANCE_AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseDetails),
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Finance Agent API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Finance Agent API response:', data);

      // Log the full response for debugging
      console.log('Full Finance Agent API response:', JSON.stringify(data));

      // Log the collected data for debugging
      if (data.data && data.data.collected_data) {
        console.log('Collected data from Finance Agent:', data.data.collected_data);
      }

      // Extract the response based on the API response structure
      let responseText = '';
      let newSessionId = sessionId;
      let isCollectingInfo = false;
      let currentStep = null;
      let collectedData = null;

      if (data.success) {
        // Successful response from unified server
        if (data.data) {
          responseText = data.data.analysis || data.data.response || data.message || 'Analysis completed successfully.';
          
          // Extract session information if available
          if (data.data.session_id) {
            newSessionId = data.data.session_id;
          }
          
          if (data.data.is_collecting_info !== undefined) {
            isCollectingInfo = data.data.is_collecting_info;
          }
          
          if (data.data.current_step) {
            currentStep = data.data.current_step;
          }
          
          if (data.data.collected_data) {
            collectedData = data.data.collected_data;
          }
        } else {
          responseText = data.message || 'Finance Agent response received successfully.';
        }
      } else {
        // Error response
        responseText = data.error || data.message || 'An error occurred while processing your request.';
      }

      // Return the formatted response
      return NextResponse.json({
        response: responseText,
        source: 'finance_agent_direct',
        sessionId: newSessionId,
        isCollectingInfo: isCollectingInfo,
        currentStep: currentStep,
        collectedData: collectedData,
        success: data.success || false
      }, { status: 200 });

    } catch (fetchError: any) {
      // Clear the timeout
      clearTimeout(timeoutId);

      console.error('Finance Agent API call failed:', fetchError);

      // Check if it's a timeout error
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          response: 'The Finance Agent is taking longer than expected to respond. Please try again.',
          source: 'timeout_error',
          sessionId: sessionId,
          isCollectingInfo: false,
          currentStep: null,
          collectedData: null,
          error: 'Request timeout'
        }, { status: 408 });
      }

      // Check if it's a network error
      if (fetchError.message.includes('fetch')) {
        console.log('Network error detected, Finance Agent backend may not be running');
        
        return NextResponse.json({
          response: 'The Finance Agent backend is currently unavailable. Please ensure the backend server is running and try again.',
          source: 'network_error',
          sessionId: sessionId,
          isCollectingInfo: false,
          currentStep: null,
          collectedData: null,
          error: 'Backend unavailable'
        }, { status: 503 });
      }

      // Fall back to the original route
      try {
        const fallbackResponse = await fetch('/api/finance-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, context })
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return NextResponse.json({
            response: data.response,
            source: 'fallback',
            sessionId: data.sessionId || null,
            isCollectingInfo: data.isCollectingInfo || false,
            currentStep: data.currentStep || null,
            collectedData: data.collectedData || null
          }, { status: 200 });
        } else {
          throw new Error('Fallback Finance Agent API call failed');
        }
      } catch (fallbackError) {
        console.error('Fallback Finance Agent API also failed:', fallbackError);
        
        return NextResponse.json({
          response: 'I apologize, but the Finance Agent is currently experiencing technical difficulties. Please try again later or contact support if the issue persists.',
          source: 'error_fallback',
          sessionId: sessionId,
          isCollectingInfo: false,
          currentStep: null,
          collectedData: null,
          error: 'All Finance Agent endpoints failed'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in Finance Agent direct route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process Finance Agent request',
        response: 'I apologize, but I encountered an error while processing your request. Please try again.',
        source: 'route_error',
        sessionId: null,
        isCollectingInfo: false,
        currentStep: null,
        collectedData: null
      },
      { status: 500 }
    );
  }
}
