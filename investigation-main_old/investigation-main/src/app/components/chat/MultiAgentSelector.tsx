'use client';

import React, { useState, useEffect } from 'react';
import { Agent, AgentType, ChatContextType } from '@/app/types';
import AgentIcon from './AgentIcon';
import agentService from '@/services/agentService';
import defaultSettings from '@/config/defaultSettings.json';

interface MultiAgentSelectorProps {
  selectedAgents: AgentType[];
  onSelectAgent: (agentType: AgentType, context?: ChatContextType) => void;
  onDeselectAgent: (agentType: AgentType) => void;
}

// Default agents from configuration
export const defaultAgents: Agent[] = defaultSettings.agentTypes;

const MultiAgentSelector: React.FC<MultiAgentSelectorProps> = ({ 
  selectedAgents, 
  onSelectAgent, 
  onDeselectAgent 
}) => {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'murder': true,  // Default expanded for murder agents
    'finance': false,
    'theft': false,
  });

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

  // Group agents by parent type
  const groupedAgents = agents.reduce((groups: Record<string, Agent[]>, agent) => {
    const groupKey = agent.parentType || agent.id;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    // Only add to group if it's a child agent
    if (agent.parentType) {
      groups[groupKey].push(agent);
    }
    
    return groups;
  }, {});

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Handle agent selection/deselection
  const handleAgentToggle = (agent: Agent) => {
    const agentType = agent.id as AgentType;
    const isSelected = selectedAgents.includes(agentType);
    
    if (isSelected) {
      onDeselectAgent(agentType);
    } else {
      // Create context with case details if available
      const context: ChatContextType = {
        agentType,
        agentName: agent.name,
      };
      
      // Add case details if this agent has cases
      if (agent.cases && agent.cases.length > 0) {
        const firstCase = agent.cases[0];
        context.caseId = firstCase.id;
        context.caseName = firstCase.name;
        context.assignedTo = firstCase.assignedTo;
        context.caseStatus = firstCase.status;
      }
      
      onSelectAgent(agentType, context);
    }
  };

  return (
    <div className="mb-4 border-b border-gray-200 pb-4">
      <h3 className="mb-2 text-sm font-medium text-gray-500">Select Investigation Agents</h3>

      {/* Only show errors in development mode */}
      {process.env.NODE_ENV === 'development' && error && (
        <p className="mb-2 text-xs text-red-500">{error}</p>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-gray-500">Loading agents...</p>
        ) : (
          <>
            {/* Main agents */}
            <div className="flex flex-wrap gap-2">
              {agents
                .filter(agent => !agent.parentType)
                .map((agent) => (
                  <label
                    key={agent.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAgents.includes(agent.id as AgentType)}
                      onChange={() => handleAgentToggle(agent)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className={`flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      selectedAgents.includes(agent.id as AgentType)
                        ? `${agent.avatarColor} text-white`
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <span className="mr-1"><AgentIcon agentType={agent.id as AgentType} /></span>
                      {agent.name}
                    </span>
                  </label>
                ))}
            </div>

            {/* Grouped agents */}
            {Object.entries(groupedAgents).map(([groupKey, groupAgents]) => {
              // Find the parent agent for this group
              const parentAgent = agents.find(a => a.id === groupKey);
              if (!parentAgent || groupAgents.length === 0) return null;

              return (
                <div key={groupKey} className="border border-gray-200 rounded-md">
                  {/* Group header */}
                  <div 
                    className={`flex items-center justify-between p-2 cursor-pointer ${
                      parentAgent.avatarColor ? parentAgent.avatarColor.replace('bg-', 'bg-opacity-10 ') : 'bg-gray-50'
                    }`}
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center">
                      <AgentIcon 
                        agentType={parentAgent.id as AgentType} 
                        className={parentAgent.avatarColor ? parentAgent.avatarColor.replace('bg-', 'text-') : 'text-gray-700'} 
                      />
                      <span className="ml-2 font-medium">{parentAgent.name}</span>
                    </div>
                    <span>{expandedGroups[groupKey] ? '−' : '+'}</span>
                  </div>

                  {/* Group content */}
                  {expandedGroups[groupKey] && (
                    <div className="p-2 space-y-1 bg-gray-50">
                      {groupAgents.map((agent) => (
                        <label
                          key={agent.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAgents.includes(agent.id as AgentType)}
                            onChange={() => handleAgentToggle(agent)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm">{agent.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MultiAgentSelector;
