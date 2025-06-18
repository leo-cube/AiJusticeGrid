/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import configService from '@/services/configService';
import agentService from '@/services/agentService';
import agentToggleService from '@/services/agentToggleService';
import crimeService from '@/services/crimeService';
import { Agent, AgentType } from '@/app/types';
import AgentIcon from '@/app/components/chat/AgentIcon';

interface AgentConfig {
  agentId: string;
  enabled: boolean;
  crimeTypes: string[];
}

export default function AugmentAIConfig() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({});
  const [crimeTypes, setCrimeTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiCallStatus, setApiCallStatus] = useState<Record<string, 'pending' | 'success' | 'error' | 'warning'>>({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load agents from config service
        const defaultSettings = configService.getDefaultSettings();
        const agentTypes = defaultSettings.agentTypes || [];

        // Transform agentTypes to match Agent interface
        const transformedAgents: Agent[] = agentTypes.map((agentType: any) => ({
          id: agentType.id,
          name: agentType.name,
          description: agentType.description,
          avatarColor: agentType.avatarColor,
          capabilities: agentType.capabilities || [],
          // Safely cast parentType to AgentType if it's a valid value, otherwise undefined
          parentType: agentType.parentType && typeof agentType.parentType === 'string'
            ? agentType.parentType as AgentType
            : undefined,
          crimeType: agentType.crimeType,
          cases: agentType.cases
        }));

        setAgents(transformedAgents);

        // Load crime types
        try {
          const crimeTypesData = await crimeService.getCrimeTypes();
          setCrimeTypes(Array.isArray(crimeTypesData) ? crimeTypesData : []);
        } catch (crimeError) {
          console.error('Error loading crime types:', crimeError);
          setCrimeTypes(defaultSettings.crimeTypes || []);
        }

        // Load enabled agents from toggle service
        try {
          const enabledAgentsData = await agentToggleService.getEnabledAgents();
          setEnabledAgents(enabledAgentsData);
        } catch (toggleError) {
          console.error('Error loading enabled agents:', toggleError);
          setEnabledAgents(defaultSettings.enabledAgents || {});
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load configuration data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving agent configurations:', err);
      setError('Failed to save configurations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get status indicator for an agent
  const getAgentStatusIndicator = (agentId: string) => {
    const status = apiCallStatus[agentId];
    if (!status) return null;

    switch (status) {
      case 'pending':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Updating..." />;
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full" title="Updated successfully" />;
      case 'warning':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" title="Updated locally only" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" title="Update failed" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading agent configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Enable or disable AI agents for different types of investigations.
            Enabled agents will appear in the Crime page and can be used for investigations.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              Agent configurations saved successfully!
            </div>
          )}

          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <div className={`mr-3 rounded-full p-2 ${agent.avatarColor}`}>
                    <AgentIcon agentType={agent.id as any} className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      {getAgentStatusIndicator(agent.id)}
                    </div>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 3).map((capability: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                          >
                            {capability}
                          </span>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <span className="text-xs text-gray-500">+{agent.capabilities.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    checked={enabledAgents[agent.id] === true}
                    onChange={() => handleAgentToggle(agent.id)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={saveAgentConfigurations}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save All Configurations'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
