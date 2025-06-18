/* eslint-disable */
// This service has been removed as suggested questions are no longer used.
// Murder and Finance agents now start directly with their conversation flow.

import { AgentType } from '@/app/types';



export const suggestedQuestionsService = {
  async getSuggestedQuestions(agentType: AgentType): Promise<string[]> {
    // Return empty array since suggested questions are no longer used
    console.log(`Suggested questions service called for ${agentType} but feature is disabled`);
    return [];
  }
};

export default suggestedQuestionsService;
