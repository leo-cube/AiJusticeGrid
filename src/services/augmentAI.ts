import { AgentType, ChatContextType } from '@/app/types';
import { generateAgentResponse } from '@/app/utils/agentUtils';
import defaultSettings from '@/config/defaultSettings.json';

// API Base URLs
const MURDER_AGENT_API_URL = process.env.NEXT_PUBLIC_MURDER_AGENT_API_URL || 'http://localhost:5000/api/augment/murder';
const THEFT_AGENT_API_URL = process.env.NEXT_PUBLIC_THEFT_AGENT_API_URL || 'http://localhost:5001/api/augment/theft';
const FINANCIAL_FRAUD_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL || 'http://localhost:5002/api/augment/financial-fraud';

/**
 * Get specialized agent for a given crime type
 * @param crimeType The type of crime
 * @param caseId Optional case ID
 * @returns Object with agentType and context
 */
export const getSpecializedAgent = async (
  crimeType: string, 
  caseId?: string
): Promise<{ agentType: AgentType; context: ChatContextType }> => {
  try {
    console.log(`Getting specialized agent for crime type: ${crimeType}, case ID: ${caseId}`);

    // Map crime types to agent types
    const crimeToAgentMap: Record<string, AgentType> = {
      'murder': 'murder',
      'homicide': 'murder',
      'killing': 'murder',
      'theft': 'theft',
      'robbery': 'theft',
      'burglary': 'theft',
      'financial-fraud': 'financial-fraud',
      'fraud': 'financial-fraud',
      'embezzlement': 'financial-fraud',
      'money-laundering': 'financial-fraud',
      'smuggling': 'smuggle',
      'smuggle': 'smuggle',
      'accident': 'crime-accident',
      'abuse': 'crime-abuse',
      'chain-snatching': 'crime-chain-snatching',
      'snatching': 'crime-chain-snatching'
    };

    // Get the appropriate agent type
    const normalizedCrimeType = crimeType.toLowerCase().replace(/[^a-z-]/g, '');
    const agentType = crimeToAgentMap[normalizedCrimeType] || 'crime';

    // Create context for the agent
    const context: any = {
      agentType,
      agentName: '',
      caseId,
      crimeType: crimeType,
      usingLiveBackend: false,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isCollectingInfo: false,
      currentStep: 'greeting',
      collectedData: {}
    };

    // Add specialized context based on agent type
    if (agentType === 'murder') {
      context.agentName = 'Murder Investigation Agent';
      context.systemPrompt = defaultSettings.specializedAgentPrompts.murder;
    } else if (agentType === 'theft') {
      context.agentName = 'Theft Investigation Agent';
      context.systemPrompt = defaultSettings.specializedAgentPrompts.theft;
    } else if (agentType === 'financial-fraud') {
      context.agentName = 'Financial Fraud Investigation Agent';
      context.systemPrompt = defaultSettings.specializedAgentPrompts.finance;
    } else {
      context.agentName = 'Crime Investigation Agent';
      context.systemPrompt = (defaultSettings.specializedAgentPrompts as any).crime || defaultSettings.specializedAgentPrompts.murder;
    }

    console.log(`Selected agent: ${agentType} for crime type: ${crimeType}`);
    return { agentType, context };

  } catch (error) {
    console.error('Error getting specialized agent:', error);
    // Fallback to general crime agent
    return {
      agentType: 'crime',
      context: {
        agentType: 'crime',
        agentName: 'Crime Investigation Agent',
        caseId,
        crimeType: crimeType,
        usingLiveBackend: false,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        systemPrompt: (defaultSettings.specializedAgentPrompts as any).crime || defaultSettings.specializedAgentPrompts.murder,
        isCollectingInfo: false,
        currentStep: 'greeting',
        collectedData: {}
      } as ChatContextType
    };
  }
};

/**
 * Get response from an agent
 * @param content The user's message
 * @param agentType The type of agent to use
 * @param context Optional context for the conversation
 * @returns The agent's response
 */
export const getResponse = async (
  content: string,
  agentType: AgentType,
  context?: ChatContextType
): Promise<string> => {
  try {
    console.log(`Getting response from ${agentType} agent for content: ${content.substring(0, 100)}...`);

    // For specialized agents, try to use their backend APIs first
    if (agentType === 'murder' && context?.usingLiveBackend) {
      try {
        const response = await fetch(MURDER_AGENT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: content,
            additional_notes: context.systemPrompt || '',
            case_id: context.caseId || '',
            session_id: context.sessionId || ''
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.analysis) {
            console.log('Successfully got response from Murder Agent backend');
            return result.data.analysis;
          }
        }
      } catch (backendError) {
        console.warn('Murder Agent backend not available, falling back to local generation');
      }
    }

    if (agentType === 'financial-fraud' && context?.usingLiveBackend) {
      try {
        const response = await fetch(FINANCIAL_FRAUD_AGENT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: content,
            additional_notes: context.systemPrompt || '',
            case_id: context.caseId || '',
            session_id: context.sessionId || ''
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.analysis) {
            console.log('Successfully got response from Financial Fraud Agent backend');
            return result.data.analysis;
          }
        }
      } catch (backendError) {
        console.warn('Financial Fraud Agent backend not available, falling back to local generation');
      }
    }

    // Fallback to local response generation
    console.log(`Using local response generation for ${agentType} agent`);
    return generateAgentResponse(content, agentType, context);

  } catch (error) {
    console.error(`Error getting response from ${agentType} agent:`, error);
    // Final fallback
    return `I apologize, but I'm experiencing technical difficulties. As a ${agentType} agent, I'm here to help with your investigation. Could you please try rephrasing your question?`;
  }
};

/**
 * Check if the Murder Agent backend is available
 * @returns True if available, false otherwise
 */
export const checkMurderAgentBackend = async (): Promise<boolean> => {
  try {
    console.log('Checking Murder Agent backend availability');
    
    const response = await fetch(MURDER_AGENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'ping',
        additional_notes: 'Health check ping'
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    const isAvailable = response.ok;
    console.log('Murder Agent backend available:', isAvailable);
    return isAvailable;

  } catch (error) {
    console.error('Error checking Murder Agent backend:', error);
    return false;
  }
};

/**
 * Check if the Financial Fraud Agent backend is available
 * @returns True if available, false otherwise
 */
export const checkFinancialFraudAgentBackend = async (): Promise<boolean> => {
  try {
    console.log('Checking Financial Fraud Agent backend availability');
    
    const response = await fetch(FINANCIAL_FRAUD_AGENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'ping',
        additional_notes: 'Health check ping'
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    const isAvailable = response.ok;
    console.log('Financial Fraud Agent backend available:', isAvailable);
    return isAvailable;

  } catch (error) {
    console.error('Error checking Financial Fraud Agent backend:', error);
    return false;
  }
};

// Default export
const augmentAIService = {
  getSpecializedAgent,
  getResponse,
  checkMurderAgentBackend,
  checkFinancialFraudAgentBackend
};

export default augmentAIService;
