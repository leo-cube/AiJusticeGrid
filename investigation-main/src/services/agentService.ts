/* eslint-disable */
import api from './api';
import defaultSettings from '@/config/defaultSettings.json';
import { Agent } from '@/app/types';
import configService from './configService';

// API endpoints
const AGENTS_ENDPOINT = defaultSettings.api.endpoints.agents;
const ASSIGNMENTS_ENDPOINT = defaultSettings.api.endpoints.assignments;
const AGENT_STATUS_ENDPOINT = `${AGENTS_ENDPOINT}/status`;

// Agent service
export const agentService = {
  // Get all agents
  getAllAgents: () => api.get<Agent[]>(AGENTS_ENDPOINT),

  // Get agent by ID
  getAgentById: (id: string) => api.get<Agent>(`${AGENTS_ENDPOINT}/${id}`),

  // Get agent by type
  getAgentByType: (type: string) => api.get<Agent>(`${AGENTS_ENDPOINT}?type=${type}`),

  // Get agent assignments
  getAgentAssignments: () => api.get(`${ASSIGNMENTS_ENDPOINT}`),

  // Get agent assignments by crime type
  getAgentAssignmentsByCrimeType: (crimeType: string) =>
    api.get(`${ASSIGNMENTS_ENDPOINT}?crimeType=${crimeType}`),

  // Get agent assignments by agent type
  getAgentAssignmentsByAgentType: (agentType: string) =>
    api.get(`${ASSIGNMENTS_ENDPOINT}?agentType=${agentType}`),

  // Create agent assignment
  createAgentAssignment: (assignment: any) =>
    api.post(ASSIGNMENTS_ENDPOINT, assignment),

  // Update agent assignment
  updateAgentAssignment: (id: string, assignment: any) =>
    api.put(`${ASSIGNMENTS_ENDPOINT}/${id}`, assignment),

  // Delete agent assignment
  deleteAgentAssignment: (id: string) =>
    api.delete(`${ASSIGNMENTS_ENDPOINT}/${id}`),

  // Toggle agent status (enable/disable)
  toggleAgentStatus: async (agentId: string, enabled: boolean) => {
    try {
      console.log(`agentService: Toggling agent ${agentId} to ${enabled} via API`);

      // Make API call to update agent status
      const response = await api.put(AGENT_STATUS_ENDPOINT, { agentId, enabled });
      console.log(`agentService: Successfully toggled agent ${agentId} via API`);

      // Also update the settings for persistence
      try {
        console.log(`agentService: Updating settings for agent ${agentId}`);

        // Get current enabled agents
        const settings = await configService.getSettings();
        const enabledAgents = settings.enabledAgents || {};

        // Update the specific agent's status
        const updatedEnabledAgents = {
          ...enabledAgents,
          [agentId]: enabled
        };

        // Save the updated configuration
        await configService.updateSetting('enabledAgents', updatedEnabledAgents);
        console.log(`agentService: Successfully updated settings for agent ${agentId}`);
      } catch (settingsError) {
        console.error(`Failed to update settings for agent ${agentId}:`, settingsError);
        // Continue since the API call succeeded
      }

      return response;
    } catch (error) {
      console.error(`Failed to toggle agent ${agentId} status via API:`, error);

      // Try to update settings as fallback
      try {
        console.log(`agentService: Falling back to settings update for agent ${agentId}`);

        // Get current enabled agents
        const settings = await configService.getSettings();
        const enabledAgents = settings.enabledAgents || {};

        // Update the specific agent's status
        const updatedEnabledAgents = {
          ...enabledAgents,
          [agentId]: enabled
        };

        // Save the updated configuration
        const result = await configService.updateSetting('enabledAgents', updatedEnabledAgents);
        console.log(`agentService: Successfully updated agent ${agentId} via settings fallback`);
        return result;
      } catch (settingsError) {
        console.error(`Failed to update settings for agent ${agentId}:`, settingsError);
        throw error; // Throw the original error
      }
    }
  },

  // Get enabled agents
  getEnabledAgents: async () => {
    console.log('agentService: Getting enabled agents');

    // Initialize with default values
    const defaultSettings = configService.getDefaultSettings();
    const defaultEnabledAgents: Record<string, boolean> = {};

    // Initialize all agents as disabled
    defaultSettings.agentTypes.forEach(agent => {
      defaultEnabledAgents[agent.id] = false;
    });

    // All agents are disabled by default
    // If there's a default enabledAgents configuration, use it
    if (defaultSettings.enabledAgents && typeof defaultSettings.enabledAgents === 'object') {
      // Use the default enabled agents configuration
      Object.entries(defaultSettings.enabledAgents).forEach(([agentId, enabled]) => {
        defaultEnabledAgents[agentId] = !!enabled;
      });
    }

    console.log('agentService: Default enabled agents:', defaultEnabledAgents);

    try {
      // Try to get from API first
      try {
        console.log(`agentService: Fetching agent status from API: ${AGENT_STATUS_ENDPOINT}`);
        const response = await api.get(AGENT_STATUS_ENDPOINT);

        if (response && typeof response === 'object') {
          console.log('agentService: Successfully fetched agent status from API:', response);
          return response;
        } else {
          console.warn('agentService: API returned invalid response format:', response);
        }
      } catch (apiError) {
        console.error('agentService: Failed to get agent status from API:', apiError);
        // Continue to try settings
      }

      // Try to get from settings
      try {
        console.log('agentService: Fetching agent status from settings');
        const settings = await configService.getSettings();

        if (settings.enabledAgents && typeof settings.enabledAgents === 'object') {
          console.log('agentService: Successfully fetched agent status from settings:', settings.enabledAgents);
          return settings.enabledAgents;
        } else {
          console.warn('agentService: Settings returned invalid enabledAgents format:', settings.enabledAgents);
        }
      } catch (settingsError) {
        console.error('agentService: Failed to get agent status from settings:', settingsError);
        // Continue to fallback
      }

      // If we reach here, return the default values
      console.log('agentService: Using default agent status values as fallback');
      return defaultEnabledAgents;
    } catch (error) {
      console.error('agentService: Failed to get enabled agents:', error);

      // Return the default values as a last resort
      console.log('agentService: Using default agent status values as last resort');
      return defaultEnabledAgents;
    }
  },

  // Update all agent statuses at once
  updateAllAgentStatuses: async (enabledAgents: Record<string, boolean>) => {
    try {
      console.log('agentService: Updating all agent statuses:', enabledAgents);

      // Make API call to update all agent statuses
      const response = await api.patch(AGENT_STATUS_ENDPOINT, { agents: enabledAgents });
      console.log('agentService: Successfully updated all agent statuses via API');

      // Also update the settings for persistence
      try {
        console.log('agentService: Updating settings with new agent statuses');
        await configService.updateSetting('enabledAgents', enabledAgents);
        console.log('agentService: Successfully updated settings');
      } catch (settingsError) {
        console.error('Failed to update settings for all agents:', settingsError);
        // Continue since the API call succeeded
      }

      return response;
    } catch (error) {
      console.error('Failed to update all agent statuses via API:', error);

      // Try to update settings as fallback
      try {
        console.log('agentService: Falling back to settings update for agent statuses');
        const result = await configService.updateSetting('enabledAgents', enabledAgents);
        console.log('agentService: Successfully updated agent statuses via settings fallback');
        return result;
      } catch (settingsError) {
        console.error('Failed to update settings for all agents:', settingsError);
        throw error; // Throw the original error
      }
    }
  }
};

export default agentService;
