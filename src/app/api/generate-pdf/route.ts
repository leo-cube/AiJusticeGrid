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
    console.log('Received body:', {
      title: body.title,
      analysisType: body.analysisType,
      agentType: body.agentType,
      messageCount: body.messages?.length || 0,
      userMetadata: body.userMetadata
    });

    // Extract data from chat messages first
    let extractedData: Record<string, any> = {};
    if (body.messages && body.messages.length > 0) {
      extractedData = extractDataFromMessages(body.messages);
      console.log('Extracted data from messages:', Object.keys(extractedData));
    }

    // Filter out userId and other unwanted metadata from extracted data
    const filteredExtractedData: Record<string, any> = { ...extractedData };
    delete filteredExtractedData.userId;
    delete filteredExtractedData.userid;
    delete filteredExtractedData.sessionId;
    delete filteredExtractedData.requestId;

    const pdfData = {
      title: body.title || 'AI Analysis Report',
      analysisType: body.analysisType || 'general',
      timestamp: new Date().toISOString(),
      data: { ...body.data, ...filteredExtractedData },
      messages: body.messages || [],
      agentType: body.agentType || 'general',
      includeAIAnalysis: body.includeAIAnalysis !== false,
      userMetadata: body.userMetadata || {
        sessionId: 'unknown',
        userId: 'unknown',
        requestId: Date.now().toString()
      }
    };

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

    // Save the report to persistent storage for future downloads
    try {
      console.log('Attempting to save report to persistent storage...');
      const saveReportResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/saved-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pdfData.title,
          agentType: pdfData.agentType,
          caseId: pdfData.data?.case_id || pdfData.data?.caseId,
          conversationData: body, // Store original conversation data for re-generation
          fileSize: pdfBuffer.byteLength,
          description: `PDF report generated from ${pdfData.agentType} agent conversation`
        }),
      });

      if (saveReportResponse.ok) {
        const savedReport = await saveReportResponse.json();
        console.log('Report saved successfully to persistent storage:', savedReport.id);
      } else {
        const errorText = await saveReportResponse.text();
        console.warn('Failed to save report to persistent storage:', errorText);
      }
    } catch (saveError) {
      console.error('Error saving report to persistent storage:', saveError);
      // Continue with PDF generation even if saving fails
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

/**
 * Extract structured financial investigation data from Financial Agent's Q&A conversation.
 */
function extractStructuredFinancialData(messages: any[]): Record<string, any> {
  const extractedData: Record<string, any> = {};
  const conversationPairs: any[] = [];

  console.log('Extracting structured financial data from', messages.length, 'messages');

  // Parse the conversation into question-answer pairs
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Check for Financial Agent questions (assistant messages)
    if (message.sender === 'assistant' &&
        (message.agentType === 'financial' || message.content.includes('Financial Fraud Agent'))) {

      // Look for the next user response
      for (let j = i + 1; j < messages.length; j++) {
        const nextMessage = messages[j];
        if (nextMessage.sender === 'user') {
          conversationPairs.push({
            question: message.content,
            answer: nextMessage.content,
            questionIndex: i,
            answerIndex: j
          });
          break;
        }
      }
    }
  }

  console.log('Found', conversationPairs.length, 'financial conversation pairs');

  // Financial Agent specific question mappings (no location field)
  const questionMappings: Record<string, string> = {
    // Case identification
    'case id': 'case_id',
    'what is the case id': 'case_id',
    'case number': 'case_id',

    // Date and time
    'when did the financial fraud incident occur': 'date_of_incident',
    'date of incident': 'date_of_incident',
    'incident occur': 'date_of_incident',

    'when was the fraud discovered': 'time_of_discovery',
    'fraud discovered': 'time_of_discovery',
    'time of discovery': 'time_of_discovery',

    // Financial institution
    'which financial institution': 'financial_institution',
    'financial institution': 'financial_institution',
    'bank name': 'financial_institution',

    // Victim information
    'name of the victim': 'victim_name',
    'victim name': 'victim_name',
    'what is the name': 'victim_name',

    // Account details
    'what type of account': 'account_type',
    'account type': 'account_type',
    'type of account': 'account_type',

    'account number': 'account_number',
    'what is the account number': 'account_number',

    // Fraud details
    'what type of financial fraud': 'fraud_type',
    'type of financial fraud': 'fraud_type',
    'fraud type': 'fraud_type',

    'financial amount involved': 'amount_involved',
    'amount involved': 'amount_involved',
    'what is the financial amount': 'amount_involved',

    'how was the fraud executed': 'method_used',
    'fraud executed': 'method_used',
    'method used': 'method_used',

    // Investigation details
    'suspicious activities': 'suspicious_activity',
    'suspicious activity': 'suspicious_activity',
    'what suspicious activities': 'suspicious_activity',

    'what evidence has been collected': 'evidence_collected',
    'evidence collected': 'evidence_collected',
    'evidence has been collected': 'evidence_collected',

    // Suspects
    'any suspects identified': 'suspects',
    'suspects identified': 'suspects',
    'are there any suspects': 'suspects',

    // Additional information
    'additional relevant information': 'additional_notes',
    'additional information': 'additional_notes',
    'relevant information': 'additional_notes',
    'any additional': 'additional_notes'
  };

  // Map answers to structured fields
  for (const pair of conversationPairs) {
    const questionLower = pair.question.toLowerCase();
    const answer = pair.answer.trim();

    // Skip empty answers
    if (!answer) continue;

    let matched = false;
    for (const [keyPhrase, fieldName] of Object.entries(questionMappings)) {
      if (questionLower.includes(keyPhrase)) {
        // Only store if we don't already have this field
        if (!extractedData[fieldName]) {
          extractedData[fieldName] = answer;
          console.log(`Mapped "${keyPhrase}" -> ${fieldName}: ${answer}`);
          matched = true;
          break;
        }
      }
    }

    // If no specific mapping found, log for debugging
    if (!matched) {
      console.warn(`No mapping found for financial question: ${questionLower.substring(0, 100)}`);
    }
  }

  // Store the full conversation for reference
  extractedData.conversation_pairs = conversationPairs;
  extractedData.total_messages = messages.length;
  extractedData.user_messages = messages.filter(m => m.sender === 'user').length;
  extractedData.assistant_messages = messages.filter(m => m.sender === 'assistant').length;

  if (messages.length > 0) {
    extractedData.conversation_start = messages[0].timestamp;
    extractedData.conversation_end = messages[messages.length - 1].timestamp;
  }

  console.log('Final extracted financial data keys:', Object.keys(extractedData));
  console.log('Financial conversation pairs found:', conversationPairs.length);

  return extractedData;
}

/**
 * Extract structured theft investigation data from Theft Agent's Q&A conversation.
 */
function extractStructuredTheftData(messages: any[]): Record<string, any> {
  const extractedData: Record<string, any> = {};
  const conversationPairs: any[] = [];

  console.log('Extracting structured theft data from', messages.length, 'messages');

  // Parse the conversation into question-answer pairs
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Check for Theft Agent questions (assistant messages)
    if (message.sender === 'assistant' &&
        (message.agentType === 'theft' || message.content.includes('Theft Agent'))) {

      // Look for the next user response
      for (let j = i + 1; j < messages.length; j++) {
        const nextMessage = messages[j];
        if (nextMessage.sender === 'user') {
          conversationPairs.push({
            question: message.content,
            answer: nextMessage.content,
            questionIndex: i,
            answerIndex: j
          });
          break;
        }
      }
    }
  }

  console.log('Found', conversationPairs.length, 'theft conversation pairs');

  // Theft Agent specific question mappings (includes location field)
  const questionMappings: Record<string, string> = {
    // Case identification
    'case id': 'case_id',
    'what is the case id': 'case_id',
    'case number': 'case_id',

    // Date and time
    'when did the theft occur': 'theft_date',
    'date of theft': 'theft_date',
    'theft occur': 'theft_date',

    'what time did the theft occur': 'theft_time',
    'time of theft': 'theft_time',

    // Location
    'where did the theft take place': 'location',
    'location of theft': 'location',
    'theft location': 'location',

    // Victim information
    'name of the victim': 'victim_name',
    'victim name': 'victim_name',
    'what is the name': 'victim_name',

    // Theft details
    'what items were stolen': 'stolen_items',
    'stolen items': 'stolen_items',
    'items stolen': 'stolen_items',

    'estimated value': 'item_value',
    'value of stolen items': 'item_value',
    'item value': 'item_value',

    'how was the theft committed': 'theft_method',
    'method of theft': 'theft_method',
    'theft method': 'theft_method',

    'how did the perpetrator gain entry': 'entry_method',
    'entry method': 'entry_method',
    'method of entry': 'entry_method',

    // Security and investigation
    'security measures in place': 'security_measures',
    'security measures': 'security_measures',

    'any witnesses': 'witnesses',
    'witnesses': 'witnesses',
    'were there witnesses': 'witnesses',

    'what evidence was found': 'evidence_found',
    'evidence found': 'evidence_found',
    'evidence': 'evidence_found',

    // Suspects
    'any suspects': 'suspects',
    'suspects': 'suspects',
    'suspected individuals': 'suspects',

    // Additional information
    'additional information': 'additional_notes',
    'additional notes': 'additional_notes',
    'any additional': 'additional_notes'
  };

  // Map answers to structured fields
  for (const pair of conversationPairs) {
    const questionLower = pair.question.toLowerCase();
    const answer = pair.answer.trim();

    // Skip empty answers
    if (!answer) continue;

    let matched = false;
    for (const [keyPhrase, fieldName] of Object.entries(questionMappings)) {
      if (questionLower.includes(keyPhrase)) {
        // Only store if we don't already have this field
        if (!extractedData[fieldName]) {
          extractedData[fieldName] = answer;
          console.log(`Mapped "${keyPhrase}" -> ${fieldName}: ${answer}`);
          matched = true;
          break;
        }
      }
    }

    // If no specific mapping found, log for debugging
    if (!matched) {
      console.warn(`No mapping found for theft question: ${questionLower.substring(0, 100)}`);
    }
  }

  // Store the full conversation for reference
  extractedData.conversation_pairs = conversationPairs;
  extractedData.total_messages = messages.length;
  extractedData.user_messages = messages.filter(m => m.sender === 'user').length;
  extractedData.assistant_messages = messages.filter(m => m.sender === 'assistant').length;

  if (messages.length > 0) {
    extractedData.conversation_start = messages[0].timestamp;
    extractedData.conversation_end = messages[messages.length - 1].timestamp;
  }

  console.log('Final extracted theft data keys:', Object.keys(extractedData));
  console.log('Theft conversation pairs found:', conversationPairs.length);

  return extractedData;
}

/**
 * Extract structured investigation data from Murder Agent's Q&A conversation.
 */
function extractStructuredInvestigationData(messages: any[]): Record<string, any> {
  const extractedData: Record<string, any> = {};
  const conversationPairs: any[] = [];

  console.log('Extracting structured data from', messages.length, 'messages');

  // Parse the conversation into question-answer pairs
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Check for Murder Agent questions (assistant messages)
    if (message.sender === 'assistant' &&
        (message.agentType === 'murder' || message.content.includes('Murder Agent'))) {

      // Clean up the question by removing formatting markers
      let question = message.content.trim();
      question = question.replace(/\*\*\[LIVE DATA ANALYSIS\]\*\*/g, '');
      question = question.replace(/Murder Agent\s*Live Data\s*Live Data Analysis\s*/g, '');
      question = question.replace(/Please answer the question to continue the investigation\./g, '');
      question = question.trim();

      // Look for the user's response in the next message
      if (i + 1 < messages.length && messages[i + 1].sender === 'user') {
        const answer = messages[i + 1].content.trim();

        // Only store non-empty answers
        if (answer) {
          console.log('Found Q&A pair:', {
            question: question.substring(0, 50) + '...',
            answer: answer
          });

          conversationPairs.push({
            question: question,
            answer: answer,
            timestamp: message.timestamp
          });
        }
      }
    }
  }

  // Enhanced question mappings to handle all Murder Agent question variations
  const questionMappings: Record<string, string> = {
    // Case ID variations
    'case id': 'case_id',
    'what is the case id': 'case_id',
    'case number': 'case_id',

    // Date and time variations
    'when did the crime occur': 'crime_date',
    'date of the crime': 'crime_date',
    'when did this happen': 'crime_date',
    'date of incident': 'crime_date',

    'what time did the crime occur': 'crime_time',
    'time of the crime': 'crime_time',
    'what time': 'crime_time',
    'time of incident': 'crime_time',

    // Location variations
    'where did the crime take place': 'location',
    'location of the crime': 'location',
    'where did this happen': 'location',
    'crime location': 'location',

    // Victim information variations
    'victim\'s name': 'victim_name',
    'name of the victim': 'victim_name',
    'who is the victim': 'victim_name',
    'victim name': 'victim_name',

    'victim\'s age': 'victim_age',
    'age of the victim': 'victim_age',
    'how old was the victim': 'victim_age',
    'victim age': 'victim_age',

    'victim\'s gender': 'victim_gender',
    'gender of the victim': 'victim_gender',
    'victim gender': 'victim_gender',

    // Crime details variations
    'cause of death': 'cause_of_death',
    'how did the victim die': 'cause_of_death',
    'what was the cause of death': 'cause_of_death',

    'weapon used': 'weapon_used',
    'what weapon was used': 'weapon_used',
    'murder weapon': 'weapon_used',
    'was a weapon used': 'weapon_used',

    // Crime scene variations
    'describe the crime scene': 'crime_scene_description',
    'crime scene description': 'crime_scene_description',
    'what did the crime scene look like': 'crime_scene_description',
    'crime scene': 'crime_scene_description',
    'please describe the crime scene': 'crime_scene_description',

    // Evidence and witnesses
    'witnesses': 'witnesses',
    'were there any witnesses': 'witnesses',
    'any witnesses': 'witnesses',

    'evidence': 'evidence_found',
    'what evidence was found': 'evidence_found',
    'evidence found': 'evidence_found',
    'any evidence': 'evidence_found',

    // Suspects
    'suspects': 'suspects',
    'any suspects': 'suspects',
    'who are the suspects': 'suspects',
    'potential suspects': 'suspects',
    'are there any suspects': 'suspects',

    // Additional information
    'additional notes': 'additional_notes',
    'anything else': 'additional_notes',
    'other information': 'additional_notes',
    'notes': 'additional_notes',
    'do you have any additional notes': 'additional_notes'
  };

  // Map answers to structured fields with improved matching
  for (const pair of conversationPairs) {
    const questionLower = pair.question.toLowerCase();
    const answer = pair.answer.trim();

    // Skip empty answers
    if (!answer) continue;

    let matched = false;
    for (const [keyPhrase, fieldName] of Object.entries(questionMappings)) {
      if (questionLower.includes(keyPhrase)) {
        // Only store if we don't already have this field
        if (!extractedData[fieldName]) {
          extractedData[fieldName] = answer;
          console.log(`Mapped "${keyPhrase}" -> ${fieldName}: ${answer}`);
          matched = true;
          break;
        }
      }
    }

    // If no specific mapping found, log for debugging
    if (!matched) {
      console.warn(`No mapping found for question: ${questionLower.substring(0, 100)}`);
    }
  }

  // Store the full conversation for reference
  extractedData.conversation_pairs = conversationPairs;
  extractedData.total_messages = messages.length;
  extractedData.user_messages = messages.filter(m => m.sender === 'user').length;
  extractedData.assistant_messages = messages.filter(m => m.sender === 'assistant').length;

  if (messages.length > 0) {
    extractedData.conversation_start = messages[0].timestamp;
    extractedData.conversation_end = messages[messages.length - 1].timestamp;
  }

  console.log('Final extracted data keys:', Object.keys(extractedData));
  console.log('Conversation pairs found:', conversationPairs.length);

  return extractedData;
}

function extractDataFromMessages(messages: any[]): Record<string, any> {
  // Check if this is a Murder Agent conversation
  const isMurderAgent = messages.some(
    message => message.sender === 'assistant' &&
    (message.agentType === 'murder' || message.content.includes('Murder Agent'))
  );

  // Check if this is a Financial Agent conversation
  const isFinancialAgent = messages.some(
    message => message.sender === 'assistant' &&
    (message.agentType === 'financial' || message.content.includes('Financial Fraud Agent'))
  );

  // Check if this is a Theft Agent conversation
  const isTheftAgent = messages.some(
    message => message.sender === 'assistant' &&
    (message.agentType === 'theft' || message.content.includes('Theft Agent'))
  );

  console.log('Is Murder Agent conversation:', isMurderAgent);
  console.log('Is Financial Agent conversation:', isFinancialAgent);
  console.log('Is Theft Agent conversation:', isTheftAgent);

  if (isMurderAgent) {
    // Use structured extraction for Murder Agent conversations
    return extractStructuredInvestigationData(messages);
  }

  if (isFinancialAgent) {
    // Use structured extraction for Financial Agent conversations
    return extractStructuredFinancialData(messages);
  }

  if (isTheftAgent) {
    // Use structured extraction for Theft Agent conversations
    return extractStructuredTheftData(messages);
  }

  // Fall back to pattern-based extraction for other conversations
  const extractedData: Record<string, any> = {};

  // Combine all user messages for comprehensive analysis
  let allUserContent = "";
  messages.forEach(message => {
    if (message.sender === 'user') {
      allUserContent += " " + message.content;
    }
  });

  // Enhanced extraction patterns
  const extractionPatterns = {
    // Basic case information
    case_id: [
      /case\s*(?:id|number)[:\s]*([^\s,\n.]+)/i,
      /case[:\s]*([A-Z0-9-]+)/i,
      /id[:\s]*([A-Z0-9-]+)/i
    ],
    crime_date: [
      /date\s*(?:of\s*crime|of\s*incident)?[:\s]*(\d{4}-\d{2}-\d{2})/i,
      /date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i
    ],
    crime_time: [
      /time\s*(?:of\s*crime|of\s*incident)?[:\s]*(\d{1,2}:\d{2})/i,
      /at\s*(\d{1,2}:\d{2})/i,
      /(\d{1,2}:\d{2})/,
      /(noon|midnight|morning|evening|afternoon)/i
    ],
    location: [
      /location[:\s]*([^.\n]+?)(?:\.|$)/i,
      /address[:\s]*([^.\n]+?)(?:\.|$)/i,
      /(?:at|in)\s*([^.\n]+?)(?:\.|$)/i,
      /street[:\s]*([^.\n]+?)(?:\.|$)/i
    ],

    // Victim information
    victim_name: [
      /victim\s*name[:\s]*([^,\n.]+)/i,
      /victim[:\s]*([^,\n.]+)/i,
      /name[:\s]*([^,\n.]+)/i
    ],
    victim_age: [
      /victim\s*age[:\s]*(\d{1,3})/i,
      /age[:\s]*(\d{1,3})/i,
      /(\d{1,3})\s*years?\s*old/i
    ],
    victim_gender: [
      /victim\s*gender[:\s]*(male|female|non-binary)/i,
      /gender[:\s]*(male|female|non-binary)/i,
      /\b(male|female)\b/i
    ],

    // Crime details
    cause_of_death: [
      /cause\s*of\s*death[:\s]*([^.\n]+?)(?:\.|$)/i,
      /died\s*(?:from|of)[:\s]*([^.\n]+?)(?:\.|$)/i,
      /killed\s*(?:by|with)[:\s]*([^.\n]+?)(?:\.|$)/i,
      /(shot|stabbed|strangled|poisoned|beaten)/i
    ],
    weapon_used: [
      /weapon\s*used[:\s]*([^.\n]+?)(?:\.|$)/i,
      /weapon[:\s]*([^.\n]+?)(?:\.|$)/i,
      /killed\s*with\s*(?:a\s*)?([^.\n]+?)(?:\.|$)/i,
      /(gun|knife|pistol|rifle|sword|bat)/i
    ],
    crime_scene_description: [
      /crime\s*scene[:\s]*([^.\n]+?)(?:\.|$)/i,
      /scene\s*description[:\s]*([^.\n]+?)(?:\.|$)/i,
      /found\s*(?:in|at)[:\s]*([^.\n]+?)(?:\.|$)/i
    ],

    // Evidence and witnesses
    witnesses: [
      /witness(?:es)?[:\s]*([^.\n]+?)(?:\.|$)/i,
      /saw[:\s]*([^.\n]+?)(?:\.|$)/i,
      /heard[:\s]*([^.\n]+?)(?:\.|$)/i,
      /(\d+)\s*people/i
    ],
    evidence_found: [
      /evidence[:\s]*([^.\n]+?)(?:\.|$)/i,
      /found[:\s]*([^.\n]+?)(?:\.|$)/i,
      /fingerprints[:\s]*([^.\n]+?)(?:\.|$)/i
    ],
    suspects: [
      /suspect(?:s)?[:\s]*([^.\n]+?)(?:\.|$)/i,
      /perpetrator[:\s]*([^.\n]+?)(?:\.|$)/i,
      /accused[:\s]*([^.\n]+?)(?:\.|$)/i
    ],

    // Additional information
    additional_notes: [
      /notes?[:\s]*([^.\n]+?)(?:\.|$)/i,
      /additional[:\s]*([^.\n]+?)(?:\.|$)/i,
      /also[:\s]*([^.\n]+?)(?:\.|$)/i
    ]
  };

  // Extract data using patterns
  for (const [field, patterns] of Object.entries(extractionPatterns)) {
    for (const pattern of patterns) {
      const match = allUserContent.match(pattern);
      if (match && !extractedData[field]) {
        let value = match[1].trim();
        // Clean up the extracted value
        value = value.replace(/\s+/g, ' '); // Normalize whitespace
        value = value.replace(/[.,;]+$/, ''); // Remove trailing punctuation
        if (value && value.length > 2) { // Only store meaningful values
          extractedData[field] = value;
        }
        break;
      }
    }
  }

  // Store individual messages for reference
  messages.forEach((message, index) => {
    if (message.sender === 'user') {
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
