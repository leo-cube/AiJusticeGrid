'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { defaultAgents } from '@/app/components/chat/AgentSelector';
import { AgentType } from '@/app/types';
import agentToggleService from '@/services/agentToggleService';
import defaultSettings from '@/config/defaultSettings.json';

export default function CrimePage() {
  const router = useRouter();
  const [crimeAgents, setCrimeAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter agents to only show crime-related and enabled agents
  useEffect(() => {
    const fetchEnabledAgents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get all agents from default settings
        const allAgents = defaultAgents;
        console.log('All available agents:', allAgents.map(a => a.id));

        // Define crime agent IDs
        const crimeAgentIds = [
          'general',
          'murder',
          'theft',
          'smuggle',
          'finance',
          'crime-accident',
          'crime-abuse'
        ];

        // Get enabled agents from the toggle service (dynamic)
        let enabledAgentsData: Record<string, boolean> = {};

        try {
          enabledAgentsData = await agentToggleService.getEnabledAgents();
          console.log('Enabled agents from toggle service:', enabledAgentsData);
        } catch (toggleError) {
          console.error('Error fetching from toggle service:', toggleError);
          // Fall back to default settings
          enabledAgentsData = defaultSettings.enabledAgents || {};
          console.log('Falling back to default settings:', enabledAgentsData);
        }

        // Filter to only include crime-related and explicitly enabled agents
        const filteredAgents = allAgents.filter(agent => {
          // Check if the agent is a crime agent
          const isCrimeAgent =
            crimeAgentIds.includes(agent.id) ||
            (agent as Agent & { crimeType?: string }).crimeType; // Include any agent with a crimeType property

          // Check if the agent is explicitly enabled (must be true)
          const isEnabled = enabledAgentsData[agent.id as keyof typeof enabledAgentsData] === true;

          return isCrimeAgent && isEnabled;
        });

        console.log('Filtered crime agents:', filteredAgents.map(a => a.id));
        setCrimeAgents(filteredAgents);
      } catch (err) {
        console.error('Error in fetchEnabledAgents:', err);
        setError('Failed to load agents. Using default configuration.');

        // Fall back to default settings for enabled agents
        const defaultEnabledAgents = defaultSettings.enabledAgents || {};

        // Define crime agent IDs
        const crimeAgentIds = [
          'general',
          'murder',
          'theft',
          'smuggle',
          'finance',
          'crime-accident',
          'crime-abuse'
        ];

        // Filter to only include crime-related and explicitly enabled agents
        const filteredAgents = defaultAgents.filter(agent => {
          // Check if the agent is a crime agent
          const isCrimeAgent =
            crimeAgentIds.includes(agent.id) ||
            agent.crimeType;

          // Check if the agent is explicitly enabled in default settings
          const isEnabled = defaultEnabledAgents[agent.id as keyof typeof defaultEnabledAgents] === true;

          return isCrimeAgent && isEnabled;
        });

        setCrimeAgents(filteredAgents);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnabledAgents();
  }, []);

  // Removed unused handleAgentSelect function

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crime Investigation</h1>
        <p className="text-gray-500">Crime investigation and analysis tools</p>
      </div>

      {/* Crime Agents Card */}
      <Card>
        <CardHeader>
          <CardTitle>Talk to Crime Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Only enabled agents will appear below. You can enable or disable agents in the Settings page.
            Select an agent to start chatting.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading agents...</span>
            </div>
          ) : crimeAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crimeAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Agent Card Header */}
                  <div className={`${agent.avatarColor} p-4 text-white`}>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-lg">{agent.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{agent.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Agent Card Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 flex-1">{agent.description}</p>

                    {/* Agent capabilities */}
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="mt-3 mb-4">
                        <div className="flex flex-wrap gap-1">
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
                      </div>
                    )}

                    {/* Talk to Agent Button */}
                    <a
                      href={`/degree-guru?agent=${agent.id}`}
                      className="mt-auto w-full py-2 px-4 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700 transition-colors"
                    >
                      Talk to {agent.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-gray-200 rounded-lg">
              <p className="text-gray-500">No agents are currently enabled for crime investigations.</p>
              <p className="text-sm text-gray-400 mt-2">You need to enable agents in the Settings page before they appear here.</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/settings')}
              >
                Go to Agent Configuration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Common Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-12 text-center justify-center">
              View Cases
            </Button>
            <Button variant="outline" className="h-12 text-center justify-center">
              File Report
            </Button>
            <Button variant="outline" className="h-12 text-center justify-center">
              Evidence Log
            </Button>
            <Button
              variant="outline"
              className="h-12 text-center justify-center"
              onClick={() => router.push('/reports?tab=download')}
            >
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
