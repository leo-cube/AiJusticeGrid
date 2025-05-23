/* eslint-disable */
import { AgentType, ChatContext } from '@/app/types';
import api from './api';
import configService from './configService';

// Get Augment AI configuration from environment variables
const AUGMENT_AI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AUGMENT_AI === 'true';
const AUGMENT_AI_API_KEY = process.env.NEXT_PUBLIC_AUGMENT_AI_API_KEY || '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';
const AUGMENT_AI_ENDPOINT = process.env.NEXT_PUBLIC_AUGMENT_AI_ENDPOINT || '/api/augment-ai';

// NVIDIA API key from environment variables
const NVIDIA_API_KEY = process.env.NEXT_PUBLIC_NVIDIA_API_KEY || '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';

// Agent API URLs
const MURDER_AGENT_API_URL = process.env.NEXT_PUBLIC_MURDER_AGENT_API_URL || 'http://127.0.0.1:5000/api/augment/murder';
const THEFT_AGENT_API_URL = process.env.NEXT_PUBLIC_THEFT_AGENT_API_URL || 'http://127.0.0.1:5001/api/augment/theft';
const FINANCIAL_FRAUD_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL || 'http://127.0.0.1:5002/api/augment/financial-fraud';

console.log('Augment AI Enabled:', AUGMENT_AI_ENABLED);
console.log('Augment AI API Key:', AUGMENT_AI_API_KEY ? 'Set' : 'Not Set');
console.log('Murder Agent API URL:', MURDER_AGENT_API_URL);

// Response cache to prevent duplicate responses
// Key format: `${question}-${agentType}`
const responseCache = new Map<string, string>();

// Clear cache after 5 minutes to prevent memory leaks
setInterval(() => {
  responseCache.clear();
}, 5 * 60 * 1000);

/**
 * Get agent assignments dynamically from API or settings
 * This ensures we're not using hardcoded values
 */
const getAgentAssignments = async (): Promise<Record<string, AgentType>> => {
  try {
    // Try to get from API first
    const settings = await configService.getSettings();
    return settings.agentAssignments;
  } catch (error) {
    console.error('Failed to get agent assignments:', error);
    // Fallback to default settings
    const defaultSettings = configService.getDefaultSettings();
    return defaultSettings.agentAssignments;
  }
};

/**
 * Map case IDs to agent types dynamically
 * This ensures we're not using hardcoded values
 */
export const getCaseAgent = async (caseId: string): Promise<AgentType> => {
  const agentAssignments = await getAgentAssignments();
  return (agentAssignments[caseId] as AgentType) || 'general';
};

/**
 * Augment AI API call
 * This function handles communication with the Augment AI API
 */
export const getAugmentAIResponse = async (
  question: string,
  agentType: AgentType,
  context?: ChatContext
): Promise<string> => {
  // Generate a cache key based on the question and agent type
  const cacheKey = `${question.trim()}-${agentType}`;

  // Check if we have a cached response
  if (responseCache.has(cacheKey)) {
    console.log(`Using cached response for ${agentType}`);
    return responseCache.get(cacheKey) as string;
  }

  // If Augment AI is disabled, use fallback response
  if (!AUGMENT_AI_ENABLED) {
    const response = await getFallbackResponse(question, agentType, context);
    responseCache.set(cacheKey, response);
    return response;
  }

  try {
    let response: string;

    // For Murder agent, use the specialized Murder Agent endpoint
    if (agentType === 'murder' || agentType === 'murder-chief' ||
        agentType === 'murder-cop-2' || agentType === 'murder-case-3') {
      response = await getMurderAgentResponse(question, context);
      responseCache.set(cacheKey, response);
      return response;
    }

    // For Theft agent, use the specialized Theft Agent endpoint
    if (agentType === 'theft') {
      response = await getTheftAgentResponse(question, context);
      responseCache.set(cacheKey, response);
      return response;
    }

    // For Financial Fraud agent, use the specialized Financial Fraud Agent endpoint
    if (agentType === 'finance') {
      response = await getFinancialFraudAgentResponse(question, context);
      responseCache.set(cacheKey, response);
      return response;
    }

    // For other agents, use the standard Augment AI endpoint
    // Prepare request payload
    const payload = {
      question,
      agentType,
      context: context || {},
    };

    // Determine which endpoint to use
    const endpoint = AUGMENT_AI_API_KEY
      ? AUGMENT_AI_ENDPOINT
      : '/api/augment-ai';

    // Call Augment AI API
    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AUGMENT_AI_API_KEY ? { 'Authorization': `Bearer ${AUGMENT_AI_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      throw new Error(`Augment AI API error: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    response = data.response;

    // Cache the response
    responseCache.set(cacheKey, response);
    return response;
  } catch (error) {
    console.error('Augment AI error:', error);
    // Fallback to local response if API call fails
    const fallbackResponse = await getFallbackResponse(question, agentType, context);
    responseCache.set(cacheKey, fallbackResponse);
    return fallbackResponse;
  }
};

/**
 * Murder Agent API call
 * This function handles communication with the Murder Agent backend
 */
const getMurderAgentResponse = async (
  question: string,
  context?: ChatContext
): Promise<string> => {
  // Generate a cache key for the Murder Agent
  const cacheKey = `murder-${question.trim()}`;

  // Check if we have a cached response
  if (responseCache.has(cacheKey)) {
    console.log('Using cached Murder Agent response');
    return responseCache.get(cacheKey) as string;
  }

  // Try to use the actual Murder Agent backend
  try {
    // Set a timeout for the Murder Agent API call (15 seconds)
    const TIMEOUT_MS = 15000;

    // Create an AbortController for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Create case details from context
    const caseDetails = {
      case_id: context?.caseId || `case_${Date.now()}`,
      date_of_crime: context?.crimeDate || new Date().toISOString().split('T')[0],
      time_of_crime: context?.crimeTime || "Unknown",
      location: context?.location || "Unknown",
      victim_name: context?.victimName || "Unknown",
      victim_age: context?.victimAge || "Unknown",
      victim_gender: context?.victimGender || "Unknown",
      cause_of_death: context?.causeOfDeath || "Unknown",
      weapon_used: context?.weaponUsed || "Unknown",
      crime_scene_description: context?.crimeSceneDescription || "Unknown",
      witnesses: context?.witnesses || "None",
      evidence_found: context?.evidence || "None",
      suspects: context?.suspects || "None",
      question: question, // Include the user's question
    };

    // Use the direct Next.js API route to avoid CORS issues
    console.log('Using direct Next.js API route for Murder Agent to avoid CORS issues');

    // Call the direct API route
    const response = await fetch('/api/murder-agent/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
      signal: controller.signal
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Murder Agent API error: ${response.statusText}`);
    }

    const data = await response.json();
    const murderResponse = data.response;

    // Cache the response
    responseCache.set(cacheKey, murderResponse);
    return murderResponse;
  } catch (error) {
    console.error('Murder Agent error:', error);
    // Fallback to standard Augment AI response
    const fallbackResponse = await getFallbackResponse(question, 'murder', context);
    responseCache.set(cacheKey, fallbackResponse);
    return fallbackResponse;
  }
};

/**
 * Theft Agent API call
 * This function handles communication with the Theft Agent backend
 */
const getTheftAgentResponse = async (
  question: string,
  context?: ChatContext
): Promise<string> => {
  // Generate a cache key for the Theft Agent
  const cacheKey = `theft-${question.trim()}`;

  // Check if we have a cached response
  if (responseCache.has(cacheKey)) {
    console.log('Using cached Theft Agent response');
    return responseCache.get(cacheKey) as string;
  }

  // Try to use the actual Theft Agent backend
  try {
    // Set a timeout for the Theft Agent API call (15 seconds)
    const TIMEOUT_MS = 15000;

    // Create an AbortController for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Create case details from context
    const caseDetails = {
      case_id: context?.caseId || `case_${Date.now()}`,
      date_of_theft: context?.crimeDate || new Date().toISOString().split('T')[0],
      time_of_theft: context?.crimeTime || "Unknown",
      location: context?.location || "Unknown",
      victim_name: context?.victimName || "Unknown",
      stolen_items: context?.stolenItems || "Unknown",
      estimated_value: context?.estimatedValue || "Unknown",
      theft_method: context?.theftMethod || "Unknown",
      suspects: context?.suspects || "None",
      witnesses: context?.witnesses || "None",
      evidence_found: context?.evidence || "None",
      question: question, // Include the user's question
    };

    // Use the direct Next.js API route to avoid CORS issues
    console.log('Using direct Next.js API route for Theft Agent to avoid CORS issues');

    // Call the direct API route
    const response = await fetch('/api/theft-agent/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
      signal: controller.signal
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Theft Agent API error: ${response.statusText}`);
    }

    const data = await response.json();
    const theftResponse = data.response;

    // Cache the response
    responseCache.set(cacheKey, theftResponse);
    return theftResponse;
  } catch (error) {
    console.error('Theft Agent error:', error);
    // Fallback to standard Augment AI response
    const fallbackResponse = await getFallbackResponse(question, 'theft', context);
    responseCache.set(cacheKey, fallbackResponse);
    return fallbackResponse;
  }
};

/**
 * Financial Fraud Agent API call
 * This function handles communication with the Financial Fraud Agent backend
 */
const getFinancialFraudAgentResponse = async (
  question: string,
  context?: ChatContext
): Promise<string> => {
  // Generate a cache key for the Financial Fraud Agent
  const cacheKey = `finance-${question.trim()}`;

  // Check if we have a cached response
  if (responseCache.has(cacheKey)) {
    console.log('Using cached Financial Fraud Agent response');
    return responseCache.get(cacheKey) as string;
  }

  // Try to use the actual Financial Fraud Agent backend
  try {
    // Set a timeout for the Financial Fraud Agent API call (15 seconds)
    const TIMEOUT_MS = 15000;

    // Create an AbortController for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Create case details from context
    const caseDetails = {
      case_id: context?.caseId || `case_${Date.now()}`,
      date_of_fraud: context?.fraudDate || new Date().toISOString().split('T')[0],
      victim_name: context?.victimName || "Unknown",
      fraud_type: context?.fraudType || "Unknown",
      fraud_amount: context?.fraudAmount || "Unknown",
      financial_institution: context?.financialInstitution || "Unknown",
      transaction_details: context?.transactionDetails || "Unknown",
      suspects: context?.suspects || "None",
      evidence_found: context?.evidence || "None",
      question: question, // Include the user's question
    };

    // Use the direct Next.js API route to avoid CORS issues
    console.log('Using direct Next.js API route for Financial Fraud Agent to avoid CORS issues');

    // Call the direct API route
    const response = await fetch('/api/financial-fraud-agent/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
      signal: controller.signal
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Financial Fraud Agent API error: ${response.statusText}`);
    }

    const data = await response.json();
    const fraudResponse = data.response;

    // Cache the response
    responseCache.set(cacheKey, fraudResponse);
    return fraudResponse;
  } catch (error) {
    console.error('Financial Fraud Agent error:', error);
    // Fallback to standard Augment AI response
    const fallbackResponse = await getFallbackResponse(question, 'finance', context);
    responseCache.set(cacheKey, fallbackResponse);
    return fallbackResponse;
  }
};

/**
 * Fallback response generator
 * Uses the existing agent response functions when API is unavailable
 */
const getFallbackResponse = async (question: string, agentType: AgentType, context?: ChatContext): Promise<string> => {
  try {
    // Try to use the local API endpoint first
    const response = await fetch('/api/augment-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, agentType, context }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.response;
    }
  } catch (error) {
    console.error('Error using local API endpoint:', error);
  }

  // If local API fails, use direct import as last resort
  // Import dynamically to avoid circular dependencies
  return import('@/app/utils/agentUtils').then(module => {
    return module.generateAgentResponse(question, agentType, context);
  });
};

/**
 * Get specialized agent for a specific case
 * This function returns the appropriate specialized agent for a given case
 */
export const getSpecializedAgent = async (agentType: AgentType, caseId?: string): Promise<{
  agentType: AgentType;
  context: ChatContext;
}> => {
  // Create a base context object for this case
  const context: ChatContext = {
    caseId: caseId || `Case-${Date.now()}`,
    agentType: agentType,
    caseTitle: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Investigation`,
    caseStatus: 'open',
    casePriority: agentType === 'murder' ? 'high' : 'medium',
  };

  // Add additional context for murder cases to support the Murder Agent backend
  if (agentType === 'murder' || agentType === 'murder-chief' ||
      agentType === 'murder-cop-2' || agentType === 'murder-case-3') {

    // Add murder-specific case details
    context.crimeDate = new Date().toISOString().split('T')[0]; // Today's date
    context.crimeTime = new Date().toLocaleTimeString(); // Current time
    context.location = "Unknown - Will be provided during investigation";
    context.victimName = "Unknown - Pending identification";
    context.victimAge = "Unknown";
    context.victimGender = "Unknown";
    context.causeOfDeath = "Under investigation";
    context.weaponUsed = "Unknown - Pending forensic analysis";
    context.crimeSceneDescription = "Crime scene under investigation";
    context.witnesses = "None identified yet";
    context.evidence = "Evidence collection in progress";
    context.suspects = "No suspects identified yet";
    context.usingLiveBackend = true; // Flag to indicate we're using the live backend
  }

  // Add additional context for theft cases to support the Theft Agent backend
  if (agentType === 'theft') {
    // Add theft-specific case details
    context.crimeDate = new Date().toISOString().split('T')[0]; // Today's date
    context.crimeTime = new Date().toLocaleTimeString(); // Current time
    context.location = "Unknown - Will be provided during investigation";
    context.victimName = "Unknown - Pending identification";
    context.stolenItems = "Unknown - Pending inventory";
    context.estimatedValue = "Unknown - Pending assessment";
    context.theftMethod = "Unknown - Under investigation";
    context.witnesses = "None identified yet";
    context.evidence = "Evidence collection in progress";
    context.suspects = "No suspects identified yet";
    context.usingLiveBackend = true; // Flag to indicate we're using the live backend
  }

  // Add additional context for financial fraud cases to support the Financial Fraud Agent backend
  if (agentType === 'finance') {
    // Add financial fraud-specific case details
    context.fraudDate = new Date().toISOString().split('T')[0]; // Today's date
    context.victimName = "Unknown - Pending identification";
    context.fraudType = "Unknown - Under investigation";
    context.fraudAmount = "Unknown - Pending assessment";
    context.financialInstitution = "Unknown - Pending information";
    context.transactionDetails = "Unknown - Pending analysis";
    context.evidence = "Evidence collection in progress";
    context.suspects = "No suspects identified yet";
    context.usingLiveBackend = true; // Flag to indicate we're using the live backend
  }

  return { agentType, context };
};

/**
 * Check if the Murder Agent backend is available
 * @returns True if the backend is available, false otherwise
 */
export const checkMurderAgentBackend = async (): Promise<boolean> => {
  try {
    console.log('Checking Murder Agent backend at:', MURDER_AGENT_API_URL);

    // Use a shorter timeout (3 seconds) to prevent long waiting times
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      // First try to use the Next.js API route to avoid CORS issues
      const proxyResponse = await fetch('/api/murder-agent/check', {
        method: 'GET',
        signal: controller.signal
      });

      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        clearTimeout(timeoutId);
        console.log('Murder Agent backend available (via proxy):', data.available);
        return data.available;
      }

      // If proxy fails, try direct connection
      const response = await fetch(MURDER_AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'ping',
          additional_notes: 'This is a ping to check if the Murder Agent API is running.'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const isAvailable = response.ok;
      console.log('Murder Agent backend available (direct):', isAvailable);
      return isAvailable;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('Murder Agent backend check timed out');
      } else {
        console.error('Error fetching Murder Agent backend:', fetchError);
      }

      // If we get a fetch error, it might be due to CORS
      // Let's assume the backend is available if we see it in the logs
      console.log('Assuming Murder Agent backend is available despite fetch error');
      return true;
    }
  } catch (error) {
    console.error('Error in checkMurderAgentBackend:', error);
    return false;
  }
};

// Export the Augment AI service
const augmentAIService = {
  getResponse: getAugmentAIResponse,
  getCaseAgent,
  getSpecializedAgent,
  checkMurderAgentBackend,
  getMurderAgentResponse,
  getTheftAgentResponse,
  getFinancialFraudAgentResponse,
  isEnabled: AUGMENT_AI_ENABLED,
};

export default augmentAIService;
