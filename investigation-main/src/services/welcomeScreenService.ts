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
    suggestedQuestions: [
      'What are the key steps in a homicide investigation?',
      'How is forensic evidence collected at a murder scene?',
      'What techniques are used for suspect profiling?',
      'How are witness testimonies verified?'
    ]
  },
  'finance': {
    title: 'Financial Fraud Assistant',
    description: 'Specialized help for financial crime investigations and fraud detection.',
    icon: 'CurrencyDollarIcon',
    suggestedQuestions: [
      'What are common financial fraud indicators?',
      'How do you trace money laundering activities?',
      'What financial documents should be analyzed in fraud cases?',
      'How are digital financial crimes investigated?'
    ]
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
