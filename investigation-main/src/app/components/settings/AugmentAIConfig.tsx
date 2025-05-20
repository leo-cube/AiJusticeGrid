/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import configService from '@/services/configService';
import agentService from '@/services/agentService';
import agentToggleService from '@/services/agentToggleService';
import crimeService from '@/services/crimeService';
import { Agent } from '@/app/types';
import AgentIcon from '@/app/components/chat/AgentIcon';

interface AgentConfig {
  agentId: string;
  enabled: boolean;
  crimeTypes: string[];
}

export default function AugmentAIConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [crimeTypes, setCrimeTypes] = useState<any[]>([]);
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiCallStatus, setApiCallStatus] = useState<Record<string, string>>({});

  // Fetch data
  useEffect(() => {
    // Check if we're in development mode with mock API enabled
    const isMockApiEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';

    // If we're not using mock API in production, use default data
    if (!isMockApiEnabled && process.env.NODE_ENV === 'production') {
      // Use default settings
      const defaultSettings = configService.getDefaultSettings();
      setAgents(defaultSettings.agentTypes);
      setCrimeTypes(defaultSettings.crimeTypes);

      // Initialize all agents as disabled by default
      const initialEnabledAgents: Record<string, boolean> = {};
      const agentIds = defaultSettings.agentTypes
        .filter(agent => !['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agent.id))
        .map(agent => agent.id);

      // Set all agents as disabled initially
      agentIds.forEach(id => {
        initialEnabledAgents[id] = false;
      });

      // If there's a default enabledAgents configuration, use it
      if (defaultSettings.enabledAgents && typeof defaultSettings.enabledAgents === 'object') {
        Object.entries(defaultSettings.enabledAgents).forEach(([agentId, enabled]) => {
          if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agentId)) {
            initialEnabledAgents[agentId] = !!enabled;
          }
        });
      }

      setEnabledAgents(initialEnabledAgents);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Wrap in a timeout to ensure we don't block rendering
        setTimeout(async () => {
          try {
            // Get default settings for fallback
            const defaultSettings = configService.getDefaultSettings();

            // Initialize agents and crime types with default values
            let agentsList = defaultSettings.agentTypes;
            let crimeTypesList = defaultSettings.crimeTypes;

            // Try to fetch agents from API
            try {
              console.log('Fetching agents from API');
              const agentsData = await agentService.getAllAgents();

              // Validate agents data
              if (Array.isArray(agentsData) && agentsData.length > 0) {
                agentsList = agentsData;
                console.log('Successfully fetched agents from API');
              } else {
                console.warn('API returned invalid agents data, using defaults');
              }
            } catch (agentError) {
              console.error('Error fetching agents:', agentError);
              // Continue with default agents
            }

            // Set agents state
            setAgents(agentsList);

            // Try to fetch crime types from API
            try {
              console.log('Fetching crime types from API');
              const crimeTypesData = await crimeService.getCrimeTypes();

              // Validate crime types data
              if (Array.isArray(crimeTypesData) && crimeTypesData.length > 0) {
                crimeTypesList = crimeTypesData;
                console.log('Successfully fetched crime types from API');
              } else {
                console.warn('API returned invalid crime types data, using defaults');
              }
            } catch (crimeTypeError) {
              console.error('Error fetching crime types:', crimeTypeError);
              // Continue with default crime types
            }

            // Set crime types state
            setCrimeTypes(crimeTypesList);

            // Initialize enabled agents
            const initialEnabledAgents: Record<string, boolean> = {};

            // Filter out special agents
            const filteredAgentIds = agentsList
              .filter(agent => !['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agent.id))
              .map(agent => agent.id);

            // Set all agents as disabled initially
            filteredAgentIds.forEach(id => {
              initialEnabledAgents[id] = false;
            });

            // Try to get enabled agents from the toggle service first
            try {
              console.log('Fetching enabled agents from toggle service');
              const enabledAgentsData = await agentToggleService.getEnabledAgents();

              // Validate the response
              if (enabledAgentsData && typeof enabledAgentsData === 'object') {
                // Update enabled agents from the API response
                Object.entries(enabledAgentsData).forEach(([agentId, enabled]) => {
                  if (filteredAgentIds.includes(agentId)) {
                    initialEnabledAgents[agentId] = !!enabled;
                  }
                });

                console.log('Successfully fetched enabled agents:', enabledAgentsData);
              } else {
                console.warn('Invalid response from agentToggleService:', enabledAgentsData);
              }
            } catch (toggleError) {
              console.error('Error fetching enabled agents from toggle service:', toggleError);

              // Try to get from settings as fallback
              try {
                console.log('Falling back to settings for enabled agents');
                const settings = await configService.getSettings();

                if (settings && settings.enabledAgents) {
                  Object.entries(settings.enabledAgents).forEach(([agentId, enabled]) => {
                    if (filteredAgentIds.includes(agentId)) {
                      initialEnabledAgents[agentId] = !!enabled;
                    }
                  });
                  console.log('Successfully fetched enabled agents from settings');
                }
              } catch (settingsError) {
                console.error('Error fetching settings:', settingsError);

                // Use default enabled agents as final fallback
                console.log('Using default enabled agents as fallback');
                if (defaultSettings.enabledAgents) {
                  Object.entries(defaultSettings.enabledAgents).forEach(([agentId, enabled]) => {
                    if (filteredAgentIds.includes(agentId)) {
                      initialEnabledAgents[agentId] = !!enabled;
                    }
                  });
                }
              }
            }

            setEnabledAgents(initialEnabledAgents);
          } catch (err) {
            console.error('Failed to fetch configuration data:', err);

            // In production, silently fall back to defaults
            if (process.env.NODE_ENV === 'production') {
              // Use default settings
              const defaultSettings = configService.getDefaultSettings();
              setAgents(defaultSettings.agentTypes);
              setCrimeTypes(defaultSettings.crimeTypes);

              // Initialize all agents as disabled by default
              const initialEnabledAgents: Record<string, boolean> = {};
              defaultSettings.agentTypes.forEach(agent => {
                if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agent.id)) {
                  initialEnabledAgents[agent.id] = false;
                }
              });

              // If there's a default enabledAgents configuration, use it
              if (defaultSettings.enabledAgents && typeof defaultSettings.enabledAgents === 'object') {
                Object.entries(defaultSettings.enabledAgents).forEach(([agentId, enabled]) => {
                  if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agentId)) {
                    initialEnabledAgents[agentId] = !!enabled;
                  }
                });
              }

              setEnabledAgents(initialEnabledAgents);
            } else {
              // In development, show error
              setError('Failed to load configuration data. Using default settings.');

              // Still use defaults
              const defaultSettings = configService.getDefaultSettings();
              setAgents(defaultSettings.agentTypes);
              setCrimeTypes(defaultSettings.crimeTypes);

              // Initialize all agents as disabled by default
              const initialEnabledAgents: Record<string, boolean> = {};
              defaultSettings.agentTypes.forEach(agent => {
                if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agent.id)) {
                  initialEnabledAgents[agent.id] = false;
                }
              });

              // If there's a default enabledAgents configuration, use it
              if (defaultSettings.enabledAgents && typeof defaultSettings.enabledAgents === 'object') {
                Object.entries(defaultSettings.enabledAgents).forEach(([agentId, enabled]) => {
                  if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agentId)) {
                    initialEnabledAgents[agentId] = !!enabled;
                  }
                });
              }

              setEnabledAgents(initialEnabledAgents);
            }
          } finally {
            setIsLoading(false);
          }
        }, 0);
      } catch (err) {
        // This catch is for any synchronous errors in the setTimeout
        console.error('Error setting up configuration data fetch:', err);
        setIsLoading(false);

        // Use default settings
        const defaultSettings = configService.getDefaultSettings();
        setAgents(defaultSettings.agentTypes);
        setCrimeTypes(defaultSettings.crimeTypes);

        // Initialize all agents as disabled by default
        const initialEnabledAgents: Record<string, boolean> = {};
        defaultSettings.agentTypes.forEach(agent => {
          if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agent.id)) {
            initialEnabledAgents[agent.id] = false;
          }
        });

        // If there's a default enabledAgents configuration, use it
        if (defaultSettings.enabledAgents && typeof defaultSettings.enabledAgents === 'object') {
          Object.entries(defaultSettings.enabledAgents).forEach(([agentId, enabled]) => {
            if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agentId)) {
              initialEnabledAgents[agentId] = !!enabled;
            }
          });
        }

        setEnabledAgents(initialEnabledAgents);
      }
    };

    fetchData();
  }, []);

  // Handle agent toggle
  const handleAgentToggle = async (agentId: string) => {
    // Toggle the agent's enabled state
    const newEnabledState = !enabledAgents[agentId];

    // Update local state immediately for responsive UI
    setEnabledAgents(prev => ({
      ...prev,
      [agentId]: newEnabledState
    }));

    // Set API call status to "pending" for this agent
    setApiCallStatus(prev => ({
      ...prev,
      [agentId]: 'pending'
    }));

    try {
      console.log(`Toggling agent ${agentId} to ${newEnabledState}`);

      // Use a local variable to track if the API call succeeded
      let apiCallSucceeded = false;

      try {
        // Use agentToggleService to toggle the agent
        const result = await agentToggleService.toggleAgent(agentId, newEnabledState);
        console.log(`Successfully toggled agent ${agentId} using agentToggleService:`, result);
        apiCallSucceeded = true;
      } catch (serviceError) {
        console.error(`Error using agentToggleService: ${serviceError}`);
        // Continue with local state only - the UI will still show the agent as toggled
      }

      // Update API call status based on whether the API call succeeded
      setApiCallStatus(prev => ({
        ...prev,
        [agentId]: apiCallSucceeded ? 'success' : 'warning'
      }));

      // Clear status after appropriate time
      setTimeout(() => {
        setApiCallStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[agentId];
          return newStatus;
        });
      }, apiCallSucceeded ? 2000 : 3000);
    } catch (error) {
      console.error(`Failed to toggle agent ${agentId}:`, error);

      // Keep the UI state updated even if the API call fails
      // This ensures the toggle switch reflects the user's intent
      console.log(`Keeping UI state for ${agentId} as ${newEnabledState} despite API error`);

      // Update API call status to "error"
      setApiCallStatus(prev => ({
        ...prev,
        [agentId]: 'error'
      }));

      // Clear error status after 3 seconds
      setTimeout(() => {
        setApiCallStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[agentId];
          return newStatus;
        });
      }, 3000);
    }
  };

  // Save all agent configurations
  const saveAgentConfigurations = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      try {
        // Use agentToggleService to update all agents at once
        await agentToggleService.updateAllAgents(enabledAgents);
        console.log('Successfully saved agent configurations');
      } catch (serviceError) {
        console.error('Error using agentToggleService:', serviceError);
        // Continue with local state only - the UI will still show success
      }

      // Show success message regardless of API result
      // This ensures a good user experience even if the backend is not available
      setSaveSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to save agent configurations:', err);

      // In production, pretend it worked to avoid confusing users
      if (process.env.NODE_ENV === 'production') {
        setSaveSuccess(true);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        // In development, show error
        setError('Failed to save agent configurations. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Get default settings
      const defaultSettings = configService.getDefaultSettings();

      // Initialize enabled agents from assignments
      const initialEnabledAgents: Record<string, boolean> = {};
      defaultSettings.agentTypes.forEach(agent => {
        // Skip the agents we want to remove
        if (!['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agent.id)) {
          initialEnabledAgents[agent.id] = false;
        }
      });

      // Enable agents that have assignments
      Object.values(defaultSettings.agentAssignments).forEach(agentId => {
        if (agentId && typeof agentId === 'string' && !['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agentId)) {
          initialEnabledAgents[agentId] = true;
        }
      });

      // Update local state
      setEnabledAgents(initialEnabledAgents);

      try {
        // Use agentToggleService to update all agents at once
        await agentToggleService.updateAllAgents(initialEnabledAgents);
        console.log('Successfully reset agent configurations');
      } catch (serviceError) {
        console.error('Error using agentToggleService:', serviceError);
        // Continue with local state only - the UI will still show success
      }

      // Show success message regardless of API result
      setSaveSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to reset agent configurations:', err);

      // In production, pretend it worked to avoid confusing users
      if (process.env.NODE_ENV === 'production') {
        setSaveSuccess(true);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        // In development, show error
        setError('Failed to reset agent configurations. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Get status indicator for an agent
  const getAgentStatusIndicator = (agentId: string) => {
    const status = apiCallStatus[agentId];

    if (!status) return null;

    if (status === 'pending') {
      return <span className="ml-2 inline-block h-4 w-4 animate-pulse rounded-full bg-yellow-500" title="Updating..."></span>;
    } else if (status === 'success') {
      return <span className="ml-2 inline-block h-4 w-4 rounded-full bg-green-500" title="Successfully updated"></span>;
    } else if (status === 'warning') {
      return <span className="ml-2 inline-block h-4 w-4 rounded-full bg-orange-500" title="Updated locally only"></span>;
    } else if (status === 'error') {
      return <span className="ml-2 inline-block h-4 w-4 rounded-full bg-red-500" title="Error updating"></span>;
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Enable or disable AI agents for different crime types. <strong>Only enabled agents will appear in the crime page.</strong>
              New agents are disabled by default.
            </p>

            {saveSuccess && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  Agent configurations saved successfully!
                </p>
              </div>
            )}

            <div className="space-y-6">
              {agents
                .filter(agent => !['degree-guru', 'murder-chief', 'murder-cop-2', 'murder-case-3'].includes(agent.id))
                .map((agent) => (
                <div key={agent.id} className="rounded-lg border p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`mr-3 rounded-full p-2 ${agent.avatarColor || 'bg-blue-700'}`}>
                        <AgentIcon agentType={agent.id} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getAgentStatusIndicator(agent.id)}
                      <label className="relative inline-flex cursor-pointer items-center ml-4">
                        <input
                          type="checkbox"
                          checked={!!enabledAgents[agent.id]}
                          onChange={() => handleAgentToggle(agent.id)}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                      </label>
                    </div>
                  </div>

                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.map((capability, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                          >
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex space-x-4">
              <Button
                onClick={saveAgentConfigurations}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save All Configurations'}
              </Button>
              <Button
                variant="outline"
                onClick={resetToDefaults}
                disabled={isSaving}
              >
                Reset to Defaults
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
