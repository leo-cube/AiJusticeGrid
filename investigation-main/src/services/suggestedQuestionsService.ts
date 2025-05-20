/* eslint-disable */
import api from './api';
import { AgentType } from '@/app/types';

// API endpoint - use a relative path without the /api prefix
// This ensures it works with Next.js API routes
const SUGGESTED_QUESTIONS_ENDPOINT = '/api/augment/suggested-questions';

// Default suggested questions by agent type
const defaultSuggestedQuestions: Record<AgentType, string[]> = {
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

// Generic fallback questions for any agent type
const genericQuestions = [
  'What can you help me with?',
  'How do I use this system?',
  'What are your capabilities?',
  'Tell me about this application'
];

// Suggested questions service
export const suggestedQuestionsService = {
  // Get suggested questions for a specific agent type
  getSuggestedQuestions: async (agentType: AgentType) => {
    try {
      console.log(`Fetching suggested questions for ${agentType} from ${SUGGESTED_QUESTIONS_ENDPOINT}`);

      // First try with the API service
      try {
        const response = await api.get(`${SUGGESTED_QUESTIONS_ENDPOINT}?agentType=${agentType}`);

        // If the response has data property, return that
        if (response && response.data) {
          console.log(`Successfully fetched suggested questions for ${agentType} from API`);
          return response.data;
        }

        // If response is an array, return it directly
        if (Array.isArray(response)) {
          console.log(`Successfully fetched suggested questions array for ${agentType} from API`);
          return response;
        }

        console.warn(`API response for ${agentType} doesn't contain expected data format`);
      } catch (apiError) {
        console.error(`API error fetching suggested questions for ${agentType}:`, apiError);

        // Try direct fetch as fallback
        try {
          console.log(`Trying direct fetch for suggested questions for ${agentType}`);
          const directResponse = await fetch(`${SUGGESTED_QUESTIONS_ENDPOINT}?agentType=${agentType}`);

          if (directResponse.ok) {
            const data = await directResponse.json();
            if (data && data.data && Array.isArray(data.data)) {
              console.log(`Successfully fetched suggested questions for ${agentType} via direct fetch`);
              return data.data;
            }
          }
        } catch (directError) {
          console.error(`Direct fetch error for suggested questions for ${agentType}:`, directError);
        }
      }

      // If we get here, both API and direct fetch failed
      console.log(`Using default suggested questions for ${agentType}`);
      return defaultSuggestedQuestions[agentType] || genericQuestions;
    } catch (error) {
      console.error(`Error in getSuggestedQuestions for ${agentType}:`, error);

      // Return default questions for this agent type
      return defaultSuggestedQuestions[agentType] || genericQuestions;
    }
  },
};

export default suggestedQuestionsService;
