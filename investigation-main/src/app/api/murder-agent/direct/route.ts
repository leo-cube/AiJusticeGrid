import { NextResponse } from 'next/server';
import { ChatContext } from '@/app/types';

// Murder Agent API URL
const MURDER_AGENT_API_URL = process.env.NEXT_PUBLIC_MURDER_AGENT_API_URL || 'http://localhost:5000/api/augment/murder';

/**
 * Direct proxy to the Murder Agent backend
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

    console.log('Murder Agent API request:', {
      question,
      sessionId: sessionId || 'new session',
      context: context ? 'provided' : 'not provided'
    });

    // Log the full session ID for debugging
    if (sessionId) {
      console.log('Using session ID:', sessionId);
    } else {
      console.log('No session ID provided, will create a new session');
    }

    // Prepare case details for the Murder Agent
    const caseDetails: Record<string, any> = {
      question: question,
      additional_notes: question,
      session_id: sessionId || null,
    };

    // Special handling for different commands
    if (question === 'CONTINUE_ANALYSIS') {
      console.log('Detected CONTINUE_ANALYSIS command, setting special flags');
      caseDetails.question = 'analyze';
      caseDetails.additional_notes = 'Please complete the analysis';
      caseDetails.force_analysis = true;
    } else if (question === 'FORCE_NEW_SESSION') {
      // Force a completely new session
      console.log('Detected FORCE_NEW_SESSION command, forcing a new session');
      caseDetails.question = 'initialize';
      caseDetails.additional_notes = 'Please start a new conversation';
      caseDetails.reset_conversation = true;
      caseDetails.force_new_session = true;

      // Clear the session ID to ensure a new one is created
      caseDetails.session_id = null;
      sessionId = null;
    } else if (question === '' || !question.trim()) {
      // If no question is provided, this is likely an initialization request
      console.log('Empty question detected, treating as initialization request');
      caseDetails.question = 'initialize';
      caseDetails.additional_notes = 'Please start a new conversation';
      caseDetails.reset_conversation = true;
    }

    // If forceReset is true, ensure we're creating a new session
    if (body.forceReset) {
      console.log('forceReset flag detected, forcing a new session');
      caseDetails.reset_conversation = true;
      caseDetails.force_new_session = true;

      // Clear the session ID to ensure a new one is created
      caseDetails.session_id = null;
      sessionId = null;
    }

    // Make sure we're explicitly setting the session_id in the request
    if (sessionId) {
      console.log('Setting session_id in request:', sessionId);
      caseDetails.session_id = sessionId;
    } else {
      // If no session ID is provided, check if there's one in the context
      if (context?.sessionId) {
        console.log('Using session ID from context:', context.sessionId);
        caseDetails.session_id = context.sessionId;
      }
    }

    // Add case details from context if available
    if (context) {
      if (context.caseId) caseDetails.case_id = context.caseId;
      if (context.caseName) caseDetails.case_name = context.caseName;
      if (context.caseStatus) caseDetails.case_status = context.caseStatus;
      if (context.casePriority) caseDetails.case_priority = context.casePriority;
      if (context.assignedTo) caseDetails.assigned_to = context.assignedTo;
      if (context.assignedDate) caseDetails.assigned_date = context.assignedDate;
      if (context.location) caseDetails.location = context.location;
      if (context.crimeDate) caseDetails.date_of_crime = context.crimeDate;
      if (context.crimeTime) caseDetails.time_of_crime = context.crimeTime;
      if (context.victimName) caseDetails.victim_name = context.victimName;
      if (context.victimAge) caseDetails.victim_age = context.victimAge;
      if (context.victimGender) caseDetails.victim_gender = context.victimGender;
      if (context.causeOfDeath) caseDetails.cause_of_death = context.causeOfDeath;
      if (context.weaponUsed) caseDetails.weapon_used = context.weaponUsed;
      if (context.crimeSceneDescription) caseDetails.crime_scene_description = context.crimeSceneDescription;
      if (context.witnesses) caseDetails.witnesses = context.witnesses;
      if (context.evidence) caseDetails.evidence_found = context.evidence;
      if (context.suspects) caseDetails.suspects = context.suspects;

      // Also include any collected data from previous interactions
      if (context.collectedData) {
        // Merge collected data with case details, prioritizing collected data
        Object.entries(context.collectedData).forEach(([key, value]) => {
          if (value) {
            caseDetails[key] = value;
          }
        });
      }

      // Do NOT include the current step from context for the first message
      // This allows the backend to properly handle the case ID
      // Only include it for subsequent messages
      if (context.currentStep && context.currentStep !== 'greeting' && context.currentStep !== 'case_id') {
        caseDetails.current_step = context.currentStep;
        console.log('Including current step in request:', context.currentStep);
      } else {
        console.log('Not including current step in request to allow proper case ID handling');
      }
    }

    // Only generate a case ID if we're starting a new conversation and no case ID is provided
    // Let the backend handle the first user input as the case ID
    if (!caseDetails.case_id && (caseDetails.force_new_session || caseDetails.reset_conversation)) {
      // Generate a case ID only for new sessions
      caseDetails.case_id = `case_${Date.now()}`;
      console.log('Generated case ID for new session:', caseDetails.case_id);
    }

    // Important: Do NOT set case_id for regular messages
    // The backend will handle the first user message as the case ID

    console.log('Sending case details to Murder Agent:', JSON.stringify(caseDetails));

    console.log('Calling Murder Agent backend directly from Next.js API route:', MURDER_AGENT_API_URL);

    // Set a timeout for the API call (60 seconds for analysis generation)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      // Call the Murder Agent API directly
      const response = await fetch(MURDER_AGENT_API_URL, {
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
        throw new Error(`Murder Agent API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Murder Agent API response:', data);

      // Log the full response for debugging
      console.log('Full Murder Agent API response:', JSON.stringify(data));

      // Log the collected data for debugging
      if (data.data && data.data.collected_data) {
        console.log('Collected data from Murder Agent:', data.data.collected_data);
      }

      // Log the current step for debugging
      if (data.data && data.data.current_step) {
        console.log('Current step from Murder Agent:', data.data.current_step);
      }

      // Check if the response has the expected format
      if (data.success && data.data && data.data.analysis) {
        // Return the analysis with a marker indicating it's from the live backend
        console.log('Returning session ID in response:', data.session_id);
        return NextResponse.json({
          response: data.data.analysis,
          source: 'direct-backend',
          sessionId: data.session_id || null,
          isCollectingInfo: data.data.is_collecting_info || false,
          currentStep: data.data.current_step || null,
          collectedData: data.data.collected_data || {}
        }, { status: 200 });
      } else if (data.data?.analysis) {
        // Alternative format
        console.log('Returning session ID in response (alternative format):', data.session_id);
        return NextResponse.json({
          response: data.data.analysis,
          source: 'direct-backend',
          sessionId: data.session_id || null,
          isCollectingInfo: data.data.is_collecting_info || false,
          currentStep: data.data.current_step || null,
          collectedData: data.data.collected_data || {}
        }, { status: 200 });
      } else if (data.success && data.message) {
        // Simple success message
        return NextResponse.json({
          response: data.message,
          source: 'direct-backend',
          sessionId: data.session_id || null,
          isCollectingInfo: true,
          currentStep: 'greeting'
        }, { status: 200 });
      } else if (data.response) {
        // Simple response format
        return NextResponse.json({
          response: data.response,
          source: 'direct-backend',
          sessionId: data.session_id || null,
          isCollectingInfo: true,
          currentStep: 'greeting'
        }, { status: 200 });
      } else {
        // Try to extract information from the response even if it doesn't match expected formats
        console.log('Attempting to extract information from non-standard response format:', data);

        // Check if there's any session_id in the response
        const sessionId = data.session_id || null;

        // Check if there's any message or text that could be used as a response
        let responseText = null;
        if (data.data && typeof data.data === 'object') {
          responseText = data.data.analysis || data.data.message || data.data.response || null;
        }

        if (!responseText && typeof data.message === 'string') {
          responseText = data.message;
        }

        if (!responseText && typeof data.response === 'string') {
          responseText = data.response;
        }

        // If we found something usable, return it
        if (responseText) {
          return NextResponse.json({
            response: responseText,
            source: 'direct-backend',
            sessionId: sessionId,
            isCollectingInfo: true,
            currentStep: 'greeting'
          }, { status: 200 });
        }

        console.error('Invalid response format from Murder Agent API:', data);
        throw new Error('Invalid response format from Murder Agent API');
      }
    } catch (error: any) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);

      console.error('Error calling Murder Agent API directly:', error);

      // If the error is due to the timeout, return a specific message
      if (error.name === 'AbortError') {
        // Check if we're at the analysis step (final step)
        const isAnalysisStep = caseDetails.current_step === 'additional_notes' ||
                              (caseDetails.collected_data &&
                               Object.keys(caseDetails.collected_data).length > 5);

        if (isAnalysisStep) {
          console.log('Timeout occurred during analysis generation, returning a helpful message');
          return NextResponse.json({
            response: "I'm generating a detailed analysis of your case, but it's taking longer than expected. This is normal for complex cases. Please try sending 'continue' or 'analyze' to complete the analysis.",
            source: 'error',
            sessionId: caseDetails.session_id || null,
            isCollectingInfo: true,
            currentStep: 'analysis_pending'
          }, { status: 200 });
        } else {
          return NextResponse.json({
            response: "I'm sorry, but the connection to the Murder Agent backend timed out. Please try again later or check if the backend service is running.",
            source: 'error',
            sessionId: null,
            isCollectingInfo: false
          }, { status: 200 });
        }
      }

      // Fall back to the original route
      try {
        const fallbackResponse = await fetch('/api/murder-agent', {
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
          throw new Error('Fallback Murder Agent API call failed');
        }
      } catch (fallbackError) {
        console.error('Error with fallback Murder Agent API call:', fallbackError);
        return NextResponse.json({
          response: `I'm sorry, but I couldn't connect to the Murder Agent backend. The error was: ${error.message}. Please try again later or check if the backend service is running.`,
          source: 'error',
          sessionId: null,
          isCollectingInfo: false
        }, { status: 200 });
      }
    }
  } catch (error: any) {
    console.error('Error processing direct Murder Agent request:', error);
    return NextResponse.json({
      response: `I'm sorry, but there was an error processing your request: ${error.message}. Please try again.`,
      source: 'error',
      sessionId: null,
      isCollectingInfo: false
    }, { status: 200 });
  }
}
