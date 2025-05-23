'use client';

import React, { useState, useEffect } from 'react';
import { Agent, AgentType } from '@/app/types';
import AgentIcon from './AgentIcon';
import agentService from '@/services/agentService';
import defaultSettings from '@/config/defaultSettings.json';

interface AgentSelectorProps {
  selectedAgent: AgentType;
  onSelectAgent: (agentType: AgentType) => void;
}

// Default agents from configuration
export const defaultAgents: Agent[] = defaultSettings.agentTypes;

const AgentSelector: React.FC<AgentSelectorProps> = ({ selectedAgent, onSelectAgent }) => {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents from API - only if not in production
  useEffect(() => {
    // Check if we're in development mode with mock API enabled
    const isMockApiEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';

    // If we're not using mock API, just use default agents without API call
    if (!isMockApiEnabled) {
      setAgents(defaultAgents);
      return;
    }

    const fetchAgents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Wrap in a timeout to ensure we don't block rendering
        setTimeout(async () => {
          try {
            const agentsData = await agentService.getAllAgents();

            // Validate the response data
            if (Array.isArray(agentsData) && agentsData.length > 0) {
              setAgents(agentsData);
            } else {
              // If response is empty or invalid, use defaults
              console.warn('API returned invalid agents data, using defaults');
              setAgents(defaultAgents);
            }
          } catch (err) {
            console.error('Failed to fetch agents:', err);
            // Silently fall back to defaults without showing error to user
            setAgents(defaultAgents);
          } finally {
            setIsLoading(false);
          }
        }, 0);
      } catch (err) {
        // This catch is for any synchronous errors in the setTimeout
        console.error('Error setting up agent fetch:', err);
        setAgents(defaultAgents);
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return (
    <div className="mb-4 border-b border-gray-200 pb-4">
      <h3 className="mb-2 text-sm font-medium text-gray-500">Select Investigation Agent</h3>

      {/* Only show errors in development mode */}
      {process.env.NODE_ENV === 'development' && error && (
        <p className="mb-2 text-xs text-red-500">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <p className="text-xs text-gray-500">Loading agents...</p>
        ) : (
          agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id as AgentType)}
              className={`flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedAgent === agent.id
                  ? `${agent.avatarColor} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1"><AgentIcon agentType={agent.id as AgentType} /></span>
              {agent.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentSelector;
