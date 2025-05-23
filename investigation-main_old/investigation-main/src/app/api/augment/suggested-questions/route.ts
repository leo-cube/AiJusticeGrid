/* eslint-disable */
import { NextResponse } from 'next/server';
import { AgentType } from '@/app/types';

// Predefined suggested questions for different agent types
const suggestedQuestions: Record<AgentType, string[]> = {
  'degree-guru': [
    'Are there resources for students interested in creative writing?',
    'Are there any workshops or seminars on entrepreneurship for students?',
    'Are there courses on environmental sustainability?',
    'What kinds of courses will I take as a philosophy major?'
  ],
  'general': [
    'What can you help me with?',
    'Tell me about the latest cases',
    'How do I analyze evidence?',
    'What investigation techniques should I use?'
  ],
  'crime': [
    'What are the recent crime statistics in the area?',
    'How do I report suspicious activity?',
    'What evidence is needed for a crime investigation?',
    'How are crime scenes processed?'
  ],
  'murder': [
    'What are the key steps in a homicide investigation?',
    'How is forensic evidence collected at a murder scene?',
    'What techniques are used for suspect profiling?',
    'How are witness testimonies verified?'
  ],
  'finance': [
    'What are common financial fraud indicators?',
    'How do you trace money laundering activities?',
    'What financial documents should be analyzed in fraud cases?',
    'How are digital financial crimes investigated?'
  ],
  'theft': [
    'What are the most common theft patterns?',
    'How do you track stolen goods?',
    'What security measures prevent theft?',
    'How do you identify professional thieves?'
  ],
  'smuggle': [
    'What are common smuggling routes?',
    'How are smuggled goods detected?',
    'What technologies are used to prevent smuggling?',
    'How do international agencies coordinate on smuggling cases?'
  ],
  'murder-chief': [
    'What resources are needed for a major homicide investigation?',
    'How do you coordinate multiple detective teams?',
    'What are the protocols for high-profile murder cases?',
    'How do you handle media relations during murder investigations?'
  ],
  'murder-cop-2': [
    'What are the standard procedures for securing a murder scene?',
    'How do you conduct initial witness interviews?',
    'What evidence collection protocols should be followed?',
    'How do you coordinate with forensic teams?'
  ],
  'murder-case-3': [
    'What are the key details of this case?',
    'Who are the primary suspects?',
    'What forensic evidence has been collected?',
    'Are there any witness statements to review?'
  ],
  'crime-accident': [
    'How do you determine if an accident was staged?',
    'What evidence is crucial in accident reconstruction?',
    'How do you analyze vehicle damage patterns?',
    'What factors indicate negligence in accidents?'
  ],
  'crime-abuse': [
    'What are the signs of domestic abuse?',
    'How do you interview abuse victims sensitively?',
    'What evidence collection protocols exist for abuse cases?',
    'How do you ensure victim safety during investigations?'
  ]
};

/**
 * GET handler for suggested questions
 * Returns suggested questions for a specific agent type
 */
export async function GET(request: Request) {
  try {
    console.log('GET /api/augment/suggested-questions - Request received');

    // Parse URL and get agent type
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType') as AgentType | null;

    console.log(`GET /api/augment/suggested-questions - Agent type: ${agentType || 'not provided'}`);

    // If agent type is provided, return questions for that agent
    if (agentType && suggestedQuestions[agentType]) {
      console.log(`GET /api/augment/suggested-questions - Returning questions for ${agentType}`);
      return NextResponse.json({
        success: true,
        data: suggestedQuestions[agentType],
        message: `Suggested questions for ${agentType} agent retrieved successfully`
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // If agent type is not found or not provided, return general questions
    console.log('GET /api/augment/suggested-questions - Returning general questions');
    return NextResponse.json({
      success: true,
      data: suggestedQuestions.general,
      message: 'Default suggested questions retrieved successfully'
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching suggested questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suggested questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
