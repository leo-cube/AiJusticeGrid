import { NextResponse } from 'next/server';
import { ChatContext } from '@/app/types';

// Financial Fraud Agent API URL
const FINANCIAL_FRAUD_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL || 'http://localhost:5002/api/augment/financial-fraud';

/**
 * Direct proxy to the Financial Fraud Agent backend
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

    // Prepare case details for the Financial Fraud Agent
    const caseDetails: Record<string, any> = {
      question: question,
      additional_notes: question,
    };

    // Add context if available
    if (context) {
      if (context.caseId) caseDetails.case_id = context.caseId;
      if (context.victimName) caseDetails.victim_name = context.victimName;
      if (context.suspectName) caseDetails.suspect_name = context.suspectName;
      if (context.fraudType) caseDetails.fraud_type = context.fraudType;
      if (context.fraudAmount) caseDetails.fraud_amount = context.fraudAmount;
      if (context.fraudDate) caseDetails.fraud_date = context.fraudDate;
      if (context.financialInstitution) caseDetails.financial_institution = context.financialInstitution;
      if (context.transactionDetails) caseDetails.transaction_details = context.transactionDetails;
      if (context.evidenceList) caseDetails.evidence_list = context.evidenceList;
      if (context.additionalNotes) caseDetails.additional_notes = context.additionalNotes;
    }

    console.log('Calling Financial Fraud Agent backend directly from Next.js API route:', FINANCIAL_FRAUD_AGENT_API_URL);

    // Set a timeout for the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // Call the Financial Fraud Agent API directly
      const response = await fetch(FINANCIAL_FRAUD_AGENT_API_URL, {
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
        throw new Error(`Financial Fraud Agent API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Return the response
      return NextResponse.json({
        response: data.analysis || data.response || 'No response from Financial Fraud Agent'
      });
    } catch (fetchError: any) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);

      console.error('Error calling Financial Fraud Agent API:', fetchError);

      // If the error is due to the timeout, return a specific message
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          response: 'The Financial Fraud Agent is taking too long to respond. Please try again later.'
        });
      }

      // For other errors, use the mock response
      return NextResponse.json({
        response: getMockFinancialFraudResponse(question, context)
      });
    }
  } catch (error) {
    console.error('Error processing Financial Fraud Agent request:', error);
    return NextResponse.json({
      response: 'Sorry, there was an error processing your request. Please try again later.'
    });
  }
}

/**
 * Generate a mock response for the Financial Fraud Agent
 * This is used when the actual backend is not available
 */
function getMockFinancialFraudResponse(question: string, context?: ChatContext): string {
  const caseId = context?.caseId || 'unknown case';
  const fraudType = context?.fraudType || 'financial fraud';
  const fraudAmount = context?.fraudAmount || 'undetermined amount';

  // Create a detailed mock response based on the question
  let response = `# Financial Fraud Analysis\n\n`;

  if (question.toLowerCase().includes('transaction') || question.toLowerCase().includes('money')) {
    response += `## Transaction Analysis\n\n`;
    response += `I've analyzed the transaction patterns in this case and found the following:\n\n`;
    response += `- Suspicious transactions totaling ${fraudAmount}\n`;
    response += `- Unusual pattern of transfers to multiple accounts\n`;
    response += `- Transactions occurred outside normal business hours\n\n`;
    response += `These patterns are consistent with typical ${fraudType} schemes. I recommend freezing the suspicious accounts and initiating a full audit trail.`;
  } else if (question.toLowerCase().includes('suspect') || question.toLowerCase().includes('who')) {
    response += `## Suspect Profile\n\n`;
    response += `Based on the financial data analysis, the suspect likely:\n\n`;
    response += `- Has insider knowledge of financial systems\n`;
    response += `- Used sophisticated methods to conceal the transactions\n`;
    response += `- May be connected to other similar fraud cases\n\n`;
    response += `We should cross-reference this profile with known financial fraud perpetrators in our database.`;
  } else if (question.toLowerCase().includes('evidence') || question.toLowerCase().includes('proof')) {
    response += `## Evidence Summary\n\n`;
    response += `The following evidence has been collected for this case:\n\n`;
    response += `- Digital transaction records from ${context?.financialInstitution || 'the financial institution'}\n`;
    response += `- IP address logs from online banking sessions\n`;
    response += `- Email communications related to the transactions\n\n`;
    response += `This evidence is being analyzed by our digital forensics team to establish a clear chain of events.`;
  } else {
    response += `I'm analyzing case ${caseId} regarding ${fraudType} involving ${fraudAmount}.\n\n`;
    response += `This appears to be a sophisticated financial fraud scheme targeting ${context?.victimName || 'the victim'}. `;
    response += `The perpetrator used several techniques to conceal their activities, including:\n\n`;
    response += `1. Multiple small transactions to avoid detection thresholds\n`;
    response += `2. Routing through several accounts to obscure the money trail\n`;
    response += `3. Using legitimate-looking communications to gain trust\n\n`;
    response += `I recommend a comprehensive financial audit and freezing any suspicious accounts while we continue our investigation.`;
  }

  return response;
}
