import { AgentType } from '@/app/types';
import { checkMurderAgentBackend as checkMurderAgentBackendOriginal } from './augmentAI';

// API Base URL - this should be just '' for Next.js API routes
const API_BASE = '';

// Helper function to get the URL for augment endpoints
const getAugmentUrl = (functionName: string) =>
  `/api/augment/${functionName}`;

// Helper function to get the URL for agent status endpoints
const getAgentStatusUrl = () => `/api/agents/status`;

// Unified Agent Server URL for direct backend communication
const UNIFIED_AGENT_SERVER_URL = process.env.NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL || 'http://localhost:5000';

/**
 * Service for managing agent toggle settings
 */
const agentToggleService = {
  /**
   * Get all enabled agents
   * @returns A record of agent IDs and their enabled status
   */
  async getEnabledAgents(): Promise<Record<string, boolean>> {
    try {
      // Try to get from API first
      try {
        console.log('Fetching enabled agents from API');
        const response = await fetch(getAgentStatusUrl());

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully fetched enabled agents from API:', result);
          return result;
        } else {
          console.warn(`API response not OK: ${response.status} ${response.statusText}`);
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
      }

      // Try to get from unified server as fallback
      try {
        console.log('Trying to fetch from unified server');
        const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/toggle-agent`);

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully fetched from unified server:', result);
          if (result.data && typeof result.data === 'object') {
            return result.data;
          }
        } else {
          console.warn(`Unified server response not OK: ${response.status} ${response.statusText}`);
        }
      } catch (unifiedError) {
        console.error('Error fetching from unified server:', unifiedError);
      }

      // Fall back to default settings
      const defaultSettings = await import('@/config/defaultSettings.json');
      console.log('Falling back to default settings for enabled agents');
      return defaultSettings.default.enabledAgents || {};
    } catch (error) {
      console.error('Error fetching enabled agents:', error);
      // Fall back to default settings
      try {
        const defaultSettings = await import('@/config/defaultSettings.json');
        console.log('Falling back to default settings after error');
        return defaultSettings.default.enabledAgents || {};
      } catch (importError) {
        console.error('Error importing default settings:', importError);
        return {};
      }
    }
  },

  /**
   * Toggle an agent's enabled status
   * @param agentId The ID of the agent to toggle
   * @param enabled The new enabled status
   * @returns The updated agent status
   */
  async toggleAgent(agentId: string, enabled: boolean): Promise<{ agentId: string, enabled: boolean }> {
    try {
      console.log(`Toggling agent ${agentId} to ${enabled} via API`);

      // First try the Next.js API route
      try {
        const response = await fetch(getAgentStatusUrl(), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agentId, enabled }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully toggled agent via Next.js API:', result);
          return {
            agentId: result.agentId || agentId,
            enabled: result.enabled || enabled
          };
        } else {
          console.warn(`Next.js API response not OK: ${response.status} ${response.statusText}`);
        }
      } catch (apiError) {
        console.error('Error toggling via Next.js API:', apiError);
      }

      // Try the unified server as fallback
      try {
        const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/toggle-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agentId, enabled }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully toggled agent via unified server:', result);
          if (result.data) {
            return {
              agentId: result.data.agentId || agentId,
              enabled: result.data.enabled || enabled
            };
          }
        } else {
          console.warn(`Unified server response not OK: ${response.status} ${response.statusText}`);
        }
      } catch (unifiedError) {
        console.error('Error toggling via unified server:', unifiedError);
      }

      // If both attempts failed but we didn't throw an error yet, return the local state
      console.log('All toggle attempts failed, returning local state');
      return { agentId, enabled };
    } catch (error) {
      console.error(`Error toggling agent ${agentId}:`, error);
      throw error;
    }
  },

  /**
   * Check if the Unified Agent Server is available
   * @returns True if the server is available, false otherwise
   */
  async checkAgentServer(): Promise<boolean> {
    try {
      console.log('Checking Unified Agent Server at:', UNIFIED_AGENT_SERVER_URL);

      // Try to make a health check request
      const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const isAvailable = response.ok;
      console.log('Unified Agent Server available:', isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking Unified Agent Server:', error);
      return false;
    }
  },

  /**
   * Update all agent statuses at once
   * @param enabledAgents Record of agent IDs and their enabled status
   * @returns The updated agent statuses
   */
  async updateAllAgents(enabledAgents: Record<string, boolean>): Promise<Record<string, boolean>> {
    try {
      console.log('Updating all agent statuses:', enabledAgents);

      // First try the Next.js API route
      try {
        const response = await fetch(getAgentStatusUrl(), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agents: enabledAgents }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully updated all agent statuses via Next.js API:', result.agents);
          return result.agents || enabledAgents;
        } else {
          console.warn(`Next.js API response not OK: ${response.status} ${response.statusText}`);
        }
      } catch (apiError) {
        console.error('Error updating via Next.js API:', apiError);
      }

      // Try the unified server as fallback
      try {
        const response = await fetch(`${UNIFIED_AGENT_SERVER_URL}/update-agents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agents: enabledAgents }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully updated all agent statuses via unified server:', result);
          if (result.data && result.data.agents) {
            return result.data.agents;
          }
        } else {
          console.warn(`Unified server response not OK: ${response.status} ${response.statusText}`);
        }
      } catch (unifiedError) {
        console.error('Error updating via unified server:', unifiedError);
      }

      // If both attempts failed but we didn't throw an error yet, return the local state
      console.log('All update attempts failed, returning local state');
      return enabledAgents;
    } catch (error) {
      console.error('Error updating all agent statuses:', error);
      throw error;
    }
  },

  /**
   * Check if the Murder Agent backend is available
   * This is a wrapper around the original function in augmentAI.ts
   * @returns True if the backend is available, false otherwise
   */
  checkMurderAgentBackend: async (): Promise<boolean> => {
    try {
      return await checkMurderAgentBackendOriginal();
    } catch (error) {
      console.error('Error in agentToggleService.checkMurderAgentBackend:', error);
      return false;
    }
  }
};

export default agentToggleService;
