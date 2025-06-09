/* eslint-disable */
import { NextResponse } from 'next/server';
import { AgentType } from '@/app/types';

// Predefined welcome screen content for different agent types
const welcomeScreenContent: Record<AgentType, {
  title: string;
  description: string;
  icon: string;
  suggestedQuestions: string[];
}> = {
  'degree-guru': {
    title: 'Welcome to DegreeGuru',
    description: 'Your ultimate companion in navigating the academic landscape of Stanford.',
    icon: 'ChatBubbleLeftRightIcon',
    suggestedQuestions: [
      'Are there resources for students interested in creative writing?',
      'Are there any workshops or seminars on entrepreneurship for students?',
      'Are there courses on environmental sustainability?',
      'What kinds of courses will I take as a philosophy major?'
    ]
  },
  'general': {
    title: 'Welcome to AugmentGuru',
    description: 'Your ultimate companion in navigating the investigation landscape.',
    icon: 'ChatBubbleLeftRightIcon',
    suggestedQuestions: [
      'What can you help me with?',
      'Tell me about the latest cases',
      'How do I analyze evidence?',
      'What investigation techniques should I use?'
    ]
  },
  'crime': {
    title: 'Crime Investigation Assistant',
    description: 'Specialized help for crime investigations and evidence analysis.',
    icon: 'ShieldCheckIcon',
    suggestedQuestions: [
      'What are the recent crime statistics in the area?',
      'How do I report suspicious activity?',
      'What evidence is needed for a crime investigation?',
      'How are crime scenes processed?'
    ]
  },
  'murder': {
    title: 'Homicide Investigation Assistant',
    description: 'Expert guidance for murder investigations and forensic analysis.',
    icon: 'ExclamationTriangleIcon',
    suggestedQuestions: []
  },
  'finance': {
    title: 'Financial Fraud Assistant',
    description: 'Specialized help for financial crime investigations and fraud detection.',
    icon: 'CurrencyDollarIcon',
    suggestedQuestions: []
  },
  'theft': {
    title: 'Theft Investigation Assistant',
    description: 'Expert guidance for theft cases and property crime investigations.',
    icon: 'ShieldExclamationIcon',
    suggestedQuestions: [
      'What are the most common theft patterns?',
      'How do you track stolen goods?',
      'What security measures prevent theft?',
      'How do you identify professional thieves?'
    ]
  },
  'smuggle': {
    title: 'Smuggling Investigation Assistant',
    description: 'Specialized help for smuggling and contraband investigations.',
    icon: 'TruckIcon',
    suggestedQuestions: [
      'What are common smuggling routes?',
      'How are smuggled goods detected?',
      'What technologies are used to prevent smuggling?',
      'How do international agencies coordinate on smuggling cases?'
    ]
  },
  'financial-fraud': {
    title: 'Financial Fraud Investigation Assistant',
    description: 'Expert guidance for financial fraud investigations.',
    icon: 'CurrencyDollarIcon',
    suggestedQuestions: [
      'How do I detect financial fraud patterns?',
      'What are common types of financial fraud?',
      'How do I trace fraudulent transactions?',
      'What evidence is needed for fraud cases?'
    ]
  },
  'exchange-matching': {
    title: 'Exchange Matching Assistant',
    description: 'Specialized help for exchange matching and discrepancy analysis.',
    icon: 'ArrowsRightLeftIcon',
    suggestedQuestions: [
      'How do I identify exchange discrepancies?',
      'What are common exchange matching issues?',
      'How do I analyze transaction patterns?',
      'What tools help with exchange matching?'
    ]
  },
  'crime-accident': {
    title: 'Accident Investigation Assistant',
    description: 'Expert guidance for accident investigations and analysis.',
    icon: 'ExclamationTriangleIcon',
    suggestedQuestions: [
      'How do I investigate traffic accidents?',
      'What evidence is needed for accident cases?',
      'How do I analyze accident scenes?',
      'What are common accident causes?'
    ]
  },
  'crime-abuse': {
    title: 'Abuse Investigation Assistant',
    description: 'Specialized help for abuse investigations and victim support.',
    icon: 'ShieldCheckIcon',
    suggestedQuestions: [
      'How do I handle abuse cases sensitively?',
      'What evidence is needed for abuse investigations?',
      'How do I support abuse victims?',
      'What are the legal requirements for abuse cases?'
    ]
  },
  'crime-chain-snatching': {
    title: 'Chain Snatching Investigation Assistant',
    description: 'Expert guidance for chain snatching and street crime investigations.',
    icon: 'ExclamationCircleIcon',
    suggestedQuestions: [
      'What are common chain snatching patterns?',
      'How do I prevent chain snatching incidents?',
      'What evidence helps solve chain snatching cases?',
      'How do I identify chain snatching suspects?'
    ]
  },
  'crime-murder': {
    title: 'Murder Investigation Assistant',
    description: 'Specialized help for murder investigations and forensic analysis.',
    icon: 'ExclamationTriangleIcon',
    suggestedQuestions: [
      'How do I secure a murder scene?',
      'What forensic evidence is crucial?',
      'How do I interview witnesses?',
      'What are the steps in a murder investigation?'
    ]
  },
  'murder-chief': {
    title: 'Murder Chief Investigation Assistant',
    description: 'Senior-level guidance for complex murder investigations.',
    icon: 'ShieldCheckIcon',
    suggestedQuestions: [
      'How do I manage a murder investigation team?',
      'What are the priorities in a murder case?',
      'How do I coordinate with forensics?',
      'What resources are needed for complex cases?'
    ]
  },
  'murder-cop-2': {
    title: 'Murder Detective Assistant',
    description: 'Detective-level support for murder investigations.',
    icon: 'MagnifyingGlassIcon',
    suggestedQuestions: [
      'How do I follow up on murder leads?',
      'What interview techniques work best?',
      'How do I analyze suspect behavior?',
      'What documentation is required?'
    ]
  },
  'murder-case-3': {
    title: 'Murder Case Specialist Assistant',
    description: 'Specialized support for specific murder case types.',
    icon: 'DocumentTextIcon',
    suggestedQuestions: [
      'How do I handle cold cases?',
      'What new techniques can solve old cases?',
      'How do I re-examine evidence?',
      'What technology helps with case analysis?'
    ]
  }
};

// Add default content for any missing agent types
const defaultContent = {
  title: 'Investigation Assistant',
  description: 'Expert guidance for your investigation needs.',
  icon: 'ChatBubbleLeftRightIcon',
  suggestedQuestions: [
    'What can you help me with?',
    'Tell me about the latest cases',
    'How do I analyze evidence?',
    'What investigation techniques should I use?'
  ]
};

/**
 * GET handler for welcome screen content
 * Returns welcome screen content for a specific agent type
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType') as AgentType | null;

    // If agent type is provided and exists in our content, return it
    if (agentType && welcomeScreenContent[agentType]) {
      return NextResponse.json({
        success: true,
        data: welcomeScreenContent[agentType],
        message: `Welcome screen content for ${agentType} agent retrieved successfully`
      }, { status: 200 });
    }

    // If agent type is not found or not provided, return general content
    return NextResponse.json({
      success: true,
      data: welcomeScreenContent.general || defaultContent,
      message: 'Default welcome screen content retrieved successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching welcome screen content:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch welcome screen content'
      },
      { status: 500 }
    );
  }
}
