'use client';

import React, { useState, useEffect } from 'react';
import { Agent } from '@/app/types';
import { defaultAgents } from '@/app/components/chat/AgentSelector';
import AgentToggleSwitch from './AgentToggleSwitch';
import agentToggleService from '@/services/agentToggleService';
import Button from '@/app/components/ui/Button';
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  TruckIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const AgentConfigurationPanel: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch enabled agents on component mount
  useEffect(() => {
    const fetchEnabledAgents = async () => {
      setIsLoading(true);
      try {
        const enabledAgentsData = await agentToggleService.getEnabledAgents();
        setEnabledAgents(enabledAgentsData);
      } catch (err) {
        console.error('Error fetching enabled agents:', err);
        setError('Failed to load agent configuration. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnabledAgents();
  }, []);

  // Handle agent toggle
  const handleAgentToggle = (agentId: string, enabled: boolean) => {
    setEnabledAgents(prev => ({
      ...prev,
      [agentId]: enabled
    }));
  };

  // Save all configurations
  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save each agent's enabled status
      const promises = Object.entries(enabledAgents).map(([agentId, enabled]) =>
        agentToggleService.toggleAgent(agentId, enabled)
      );

      await Promise.all(promises);

      // Show success message or notification
      alert('All agent configurations saved successfully!');
    } catch (err) {
      console.error('Error saving agent configurations:', err);
      setError('Failed to save configurations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    // Import defaultSettings directly
    import('@/config/defaultSettings.json')
      .then(module => {
        // Reset to default enabled status from defaultSettings
        const defaultEnabled: Record<string, boolean> = {};
        const defaultSettings = module.default;

        agents.forEach(agent => {
          // Use the default enabled status from defaultSettings, or false for new agents
          defaultEnabled[agent.id] = defaultSettings.enabledAgents?.[agent.id] === true;
        });

        setEnabledAgents(defaultEnabled);
      })
      .catch(err => {
        console.error('Error loading default settings:', err);

        // Fallback: set core agents to true, others to false
        const defaultEnabled: Record<string, boolean> = {};
        const coreAgents = ['general', 'murder', 'finance', 'theft'];

        agents.forEach(agent => {
          defaultEnabled[agent.id] = coreAgents.includes(agent.id);
        });

        setEnabledAgents(defaultEnabled);
      });
  };

  // Get icon for agent
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'degree-guru':
        return <AcademicCapIcon className="h-5 w-5 text-white" />;
      case 'general':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />;
      case 'murder':
      case 'murder-chief':
      case 'murder-cop-2':
      case 'murder-case-3':
        return <ExclamationTriangleIcon className="h-5 w-5 text-white" />;
      case 'finance':
        return <CurrencyDollarIcon className="h-5 w-5 text-white" />;
      case 'theft':
      case 'crime-accident':
      case 'crime-abuse':
        return <ShieldCheckIcon className="h-5 w-5 text-white" />;
      case 'smuggle':
        return <TruckIcon className="h-5 w-5 text-white" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading agent configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Augment AI Agent Configuration</h3>
      </div>

      <div>
        <p className="mb-4 text-sm text-gray-500">
          Enable or disable AI agents for different crime types. When enabled, agents will appear in the crime page.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`mr-3 rounded-full p-2 ${agent.avatarColor}`}>
                    {getAgentIcon(agent.id)}
                  </div>
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                  </div>
                </div>

                <AgentToggleSwitch
                  agentId={agent.id}
                  initialEnabled={enabledAgents[agent.id] === true}
                  onToggle={handleAgentToggle}
                />
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
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save All Configurations'}
          </Button>

          <Button
            variant="outline"
            onClick={handleResetDefaults}
            disabled={isSaving}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfigurationPanel;
