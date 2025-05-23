'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/app/context/ChatContext';
import Button from '@/app/components/ui/Button';
import augmentAIService from '@/services/augmentAI';
import agentService from '@/services/agentService';
import configService from '@/services/configService';
import { Agent } from '@/app/types';

interface TalkToAgentButtonProps {
  crimeType: string;
  caseId?: string;
  caseTitle?: string;
  caseName?: string;
  caseStatus?: string;
  casePriority?: string;
  assignedTo?: string;
  assignedDate?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TalkToAgentButton: React.FC<TalkToAgentButtonProps> = ({
  crimeType,
  caseId,
  caseTitle,
  caseName,
  caseStatus = 'open',
  casePriority = 'medium',
  assignedTo,
  assignedDate,
  buttonText,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const { toggleChat, setCurrentAgent, clearMessages } = useChat();
  const router = useRouter();
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>({});
  const [assignedAgent, setAssignedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch enabled agents and find the assigned agent for this crime type
  useEffect(() => {
    const fetchAgentData = async () => {
      setIsLoading(true);
      try {
        // Get enabled agents
        const enabledAgentsData = await agentService.getEnabledAgents();
        setEnabledAgents(enabledAgentsData);

        // Get all agents
        const defaultSettings = configService.getDefaultSettings();
        const allAgents = defaultSettings.agentTypes;

        // Find the assigned agent for this crime type
        const matchingAgent = allAgents.find(agent => {
          // Check if agent is explicitly enabled (must be true)
          if (enabledAgentsData[agent.id] !== true) return false;

          // Check if agent is for this crime type
          if (agent.crimeType === crimeType) return true;

          // For agents without specific crime type, check if they're assigned to this type
          if (!agent.crimeType) {
            const assignments = defaultSettings.agentAssignments;
            return Object.entries(assignments).some(([crimeId, agentId]) => {
              return crimeId === crimeType && agentId === agent.id;
            });
          }

          return false;
        });

        setAssignedAgent(matchingAgent || null);
      } catch (error) {
        console.error(`Failed to fetch agent data for ${crimeType}:`, error);
        setAssignedAgent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, [crimeType]);

  const handleClick = async () => {
    try {
      // Clear previous messages to start a fresh chat
      clearMessages();

      // Clear any stored Murder Agent session ID
      try {
        localStorage.removeItem('murderAgentSessionId');
        console.log('Cleared stored Murder Agent session ID');
      } catch (e) {
        console.error('Failed to clear stored Murder Agent session ID:', e);
      }

      // If we have an assigned agent, use it
      if (assignedAgent) {
        const context = {
          crimeType,
          caseId,
          caseTitle: caseTitle || `${crimeType} Investigation`,
          caseName,
          caseStatus,
          casePriority,
          assignedTo,
          assignedDate,
          usingLiveBackend: true // Enable live data for all agents
        };

        // For Murder Agent, initialize a completely new session
        if (assignedAgent.id === 'murder') {
          try {
            console.log('Initializing new Murder Agent session');

            // Create a fresh context for the Murder Agent
            context = {
              crimeType,
              caseId,
              caseTitle: caseTitle || `${crimeType} Investigation`,
              caseName,
              caseStatus,
              casePriority,
              assignedTo,
              assignedDate,
              usingLiveBackend: true,
              isCollectingInfo: true,
              currentStep: 'greeting',
              collectedData: {}
            };

            // Call the Murder Agent API to get a greeting and session ID
            const response = await fetch('/api/murder-agent/direct', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: 'FORCE_NEW_SESSION',
                context,
                forceReset: true
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Murder Agent initialization response:', data);

              if (data.sessionId) {
                // Add session information to the context
                context.sessionId = data.sessionId;

                // Store the session ID in localStorage
                try {
                  localStorage.setItem('murderAgentSessionId', data.sessionId);
                  console.log('Saved new session ID to localStorage:', data.sessionId);
                } catch (e) {
                  console.error('Failed to save session ID to localStorage:', e);
                }

                console.log('Murder Agent session initialized with ID:', data.sessionId);
              }
            }
          } catch (error) {
            console.error('Error initializing Murder Agent session:', error);
            // Continue even if initialization fails
          }
        }

        // Set the current agent in the chat context
        setCurrentAgent(assignedAgent.id, context);
      } else {
        // Get the specialized agent
        const { agentType: specializedAgentType, context } = await augmentAIService.getSpecializedAgent(crimeType, caseId);

        // Override context with provided props if available
        if (caseTitle) context.caseTitle = caseTitle;
        if (caseName) context.caseName = caseName;
        if (caseStatus) context.caseStatus = caseStatus;
        if (casePriority) context.casePriority = casePriority;
        if (assignedTo) context.assignedTo = assignedTo;
        if (assignedDate) context.assignedDate = assignedDate;

        // Enable live data for all agents
        context.usingLiveBackend = true;

        // For Murder Agent, initialize a completely new session
        if (specializedAgentType === 'murder') {
          try {
            console.log('Initializing new Murder Agent session');

            // Create a fresh context for the Murder Agent
            context = {
              ...context,
              usingLiveBackend: true,
              isCollectingInfo: true,
              currentStep: 'greeting',
              collectedData: {}
            };

            // Call the Murder Agent API to get a greeting and session ID
            const response = await fetch('/api/murder-agent/direct', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: 'FORCE_NEW_SESSION',
                context,
                forceReset: true
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Murder Agent initialization response:', data);

              if (data.sessionId) {
                // Add session information to the context
                context.sessionId = data.sessionId;

                // Store the session ID in localStorage
                try {
                  localStorage.setItem('murderAgentSessionId', data.sessionId);
                  console.log('Saved new session ID to localStorage:', data.sessionId);
                } catch (e) {
                  console.error('Failed to save session ID to localStorage:', e);
                }

                console.log('Murder Agent session initialized with ID:', data.sessionId);
              }
            }
          } catch (error) {
            console.error('Error initializing Murder Agent session:', error);
            // Continue even if initialization fails
          }
        }

        // Set the current agent in the chat context
        setCurrentAgent(specializedAgentType, context);
      }

      // Redirect to the DegreeGuru chat interface with the appropriate agent
      const agentType = assignedAgent ? assignedAgent.id : specializedAgentType;
      router.push(`/degree-guru?agent=${agentType}`);
    } catch (error) {
      console.error('Error initializing agent chat:', error);
      // Fallback to general agent
      setCurrentAgent('general');
      // Redirect to DegreeGuru chat page even in case of error
      router.push('/degree-guru?agent=general');
    }
  };

  // Determine the button text based on the agent type
  const getButtonText = () => {
    if (buttonText) return buttonText;

    if (assignedAgent) {
      return `Talk to ${assignedAgent.name}`;
    }

    const formattedCrimeType = crimeType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `Talk to ${formattedCrimeType} Agent`;
  };

  // Check if any agents are enabled
  const hasEnabledAgents = Object.values(enabledAgents).some(enabled => enabled);

  // If loading or no agents are enabled, show a disabled button
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={true}
      >
        Loading...
      </Button>
    );
  }

  // If no agents are enabled, show a different message
  if (!assignedAgent && !hasEnabledAgents) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} cursor-not-allowed opacity-70`}
        disabled={true}
        title="No agents are enabled. Enable agents in settings."
      >
        No Agents Available
      </Button>
    );
  }

  // Normal button when agents are available
  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      {getButtonText()}
    </Button>
  );
};

export default TalkToAgentButton;
