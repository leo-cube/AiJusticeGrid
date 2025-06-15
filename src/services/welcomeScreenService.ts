/* eslint-disable */
import { AgentType } from '@/app/types';

// Welcome screen content type
export interface WelcomeScreenContent {
  title: string;
  description: string;
  icon: string;
  suggestedQuestions: string[];
}

// Predefined welcome screen content for different agent types
const welcomeScreenContent: Record<AgentType, WelcomeScreenContent> = {
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
    description: 'Expert guidance for financial fraud investigations and analysis.',
    icon: 'CurrencyDollarIcon',
    suggestedQuestions: [
      'What are common financial fraud patterns?',
      'How do you detect insider trading?',
      'What are the signs of money laundering?',
      'How do you track suspicious transactions?'
    ]
  },
  'exchange-matching': {
    title: 'Exchange Matching Assistant',
    description: 'Specialized help for exchange matching and discrepancy analysis.',
    icon: 'ArrowsRightLeftIcon',
    suggestedQuestions: [
      'What are exchange mismatches?',
      'How do you identify suspicious trading patterns?',
      'What are the signs of market manipulation?',
      'How do you track cross-exchange transactions?'
    ]
  },
  'crime-theft': {
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
  'crime-accident': {
    title: 'Accident Investigation Assistant',
    description: 'Expert guidance for accident reconstruction and investigation.',
    icon: 'ExclamationTriangleIcon',
    suggestedQuestions: [
      'How do you reconstruct an accident scene?',
      'What evidence is crucial in accident investigations?',
      'How do you determine fault in accidents?',
      'What are common accident causes?'
    ]
  },
  'crime-abuse': {
    title: 'Abuse Investigation Assistant',
    description: 'Specialized help for abuse cases and victim support.',
    icon: 'HeartIcon',
    suggestedQuestions: [
      'How do you support abuse victims?',
      'What are the signs of abuse patterns?',
      'How do you assess risk in abuse cases?',
      'What evidence is important in abuse investigations?'
    ]
  },
  'crime-chain-snatching': {
    title: 'Chain Snatching Investigation Assistant',
    description: 'Expert guidance for chain snatching cases and prevention.',
    icon: 'LinkIcon',
    suggestedQuestions: [
      'What are chain snatching hotspots?',
      'How do you profile chain snatching victims?',
      'What are effective prevention strategies?',
      'How do you track chain snatching offenders?'
    ]
  },
  'crime-murder': {
    title: 'Murder Investigation Assistant',
    description: 'Expert guidance for murder investigations and forensic analysis.',
    icon: 'ExclamationTriangleIcon',
    suggestedQuestions: [
      'What are the forensic priorities in murder cases?',
      'How do you assess motive in homicides?',
      'What are common suspect profiling techniques?',
      'How do you reconstruct a murder timeline?'
    ]
  },
  'murder-chief': {
    title: 'Murder Chief Investigation Assistant',
    description: 'Senior-level guidance for complex murder investigations.',
    icon: 'StarIcon',
    suggestedQuestions: [
      'How do you manage complex murder investigations?',
      'What are the key leadership decisions in homicide cases?',
      'How do you coordinate multi-agency investigations?',
      'What are the strategic priorities in murder cases?'
    ]
  },
  'murder-cop-2': {
    title: 'Murder Detective Assistant',
    description: 'Detective-level guidance for murder investigations.',
    icon: 'MagnifyingGlassIcon',
    suggestedQuestions: [
      'What are the key investigative steps in murder cases?',
      'How do you interview witnesses in homicide investigations?',
      'What are the best practices for evidence collection?',
      'How do you follow leads in murder cases?'
    ]
  },
  'murder-case-3': {
    title: 'Murder Case 3 Specialist',
    description: 'Specialized assistance for Murder Case 3 investigation.',
    icon: 'DocumentTextIcon',
    suggestedQuestions: [
      'What are the specifics of Murder Case 3?',
      'What evidence has been collected so far?',
      'What are the current leads in this case?',
      'What are the next steps in the investigation?'
    ]
  }
};

// Default content for any missing agent types
const defaultContent: WelcomeScreenContent = {
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

// Welcome screen service
export const welcomeScreenService = {
  // Get welcome screen content for a specific agent type
  getWelcomeScreenContent: async (agentType: AgentType): Promise<WelcomeScreenContent> => {
    try {
      // Return predefined content directly instead of making API calls
      if (welcomeScreenContent[agentType]) {
        return welcomeScreenContent[agentType];
      }

      // If agent type is not found, return default content
      return defaultContent;
    } catch (error) {
      console.error(`Error getting welcome screen content for ${agentType}:`, error);
      // Return default content if there's an error
      return defaultContent;
    }
  },
};

export default welcomeScreenService;
