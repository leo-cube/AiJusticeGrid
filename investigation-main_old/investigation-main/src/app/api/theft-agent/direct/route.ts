import { NextResponse } from 'next/server';
import { ChatContext } from '@/app/types';

// Theft Agent API URL
const THEFT_AGENT_API_URL = process.env.NEXT_PUBLIC_THEFT_AGENT_API_URL || 'http://localhost:5001/api/augment/theft';

/**
 * Direct proxy to the Theft Agent backend
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

    // Prepare case details for the Theft Agent
    const caseDetails: Record<string, any> = {
      question: question,
      additional_notes: question,
    };

    // Add context if available
    if (context) {
      if (context.caseId) caseDetails.case_id = context.caseId;
      if (context.victimName) caseDetails.victim_name = context.victimName;
      if (context.suspectName) caseDetails.suspect_name = context.suspectName;
      if (context.crimeLocation) caseDetails.crime_location = context.crimeLocation;
      if (context.crimeDate) caseDetails.crime_date = context.crimeDate;
      if (context.stolenItems) caseDetails.stolen_items = context.stolenItems;
      if (context.estimatedValue) caseDetails.estimated_value = context.estimatedValue;
      if (context.theftMethod) caseDetails.theft_method = context.theftMethod;
      if (context.evidenceList) caseDetails.evidence_list = context.evidenceList;
      if (context.witnessStatements) caseDetails.witness_statements = context.witnessStatements;
      if (context.additionalNotes) caseDetails.additional_notes = context.additionalNotes;
    }

    console.log('Calling Theft Agent backend directly from Next.js API route:', THEFT_AGENT_API_URL);

    // Set a timeout for the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // Call the Theft Agent API directly
      const response = await fetch(THEFT_AGENT_API_URL, {
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
        throw new Error(`Theft Agent API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Return the response
      return NextResponse.json({
        response: data.analysis || data.response || 'No response from Theft Agent'
      });
    } catch (fetchError: any) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);

      console.error('Error calling Theft Agent API:', fetchError);

      // If the error is due to the timeout, return a specific message
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          response: 'The Theft Agent is taking too long to respond. Please try again later.'
        });
      }

      // For other errors, use the mock response
      return NextResponse.json({
        response: getMockTheftResponse(question, context)
      });
    }
  } catch (error) {
    console.error('Error processing Theft Agent request:', error);
    return NextResponse.json({
      response: 'Sorry, there was an error processing your request. Please try again later.'
    });
  }
}

/**
 * Generate a mock response for the Theft Agent
 * This is used when the actual backend is not available
 */
function getMockTheftResponse(question: string, context?: ChatContext): string {
  const caseId = context?.caseId || 'unknown case';
  const stolenItems = context?.stolenItems || 'the stolen items';

  // Create a detailed mock response based on the question
  let response = `# Theft Case Analysis\n\n`;

  if (question.toLowerCase().includes('what') && question.toLowerCase().includes('stolen')) {
    response += `Based on the initial investigation, the following items were reported stolen:\n\n`;
    response += `- ${stolenItems || 'Various personal belongings'}\n`;
    response += `- Estimated value: ${context?.estimatedValue || 'Under assessment'}\n\n`;
    response += `We are currently working on recovering these items and tracking their potential location.`;
  } else if (question.toLowerCase().includes('suspect') || question.toLowerCase().includes('who')) {
    response += `## Suspect Analysis\n\n`;
    response += `Based on the evidence collected so far, we have the following suspect profile:\n\n`;
    response += `- Likely an opportunistic thief familiar with the area\n`;
    response += `- Possibly has prior experience with similar thefts\n`;
    response += `- May have been monitoring the location before the theft\n\n`;
    response += `We are currently reviewing security footage and witness statements to identify potential suspects.`;
  } else if (question.toLowerCase().includes('evidence')) {
    response += `## Evidence Summary\n\n`;
    response += `The following evidence has been collected from the scene:\n\n`;
    response += `- Partial fingerprints on entry points\n`;
    response += `- Security camera footage (currently being analyzed)\n`;
    response += `- Witness statements from nearby residents\n\n`;
    response += `The forensic team is processing this evidence to identify the perpetrator.`;
  } else {
    response += `I'm analyzing case ${caseId} regarding the theft of ${stolenItems}.\n\n`;
    response += `Based on the information provided, this appears to be a ${context?.theftMethod || 'standard theft'} case. `;
    response += `We are currently investigating all leads and processing evidence from the scene.\n\n`;
    response += `Our team is working diligently to recover the stolen items and identify the perpetrator. `;
    response += `Please provide any additional details that might help with the investigation.`;
  }

  return response;
}
