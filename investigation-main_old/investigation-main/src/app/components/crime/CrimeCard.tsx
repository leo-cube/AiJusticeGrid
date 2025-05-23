/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardContent } from '@/app/components/ui/Card';
import TalkToAgentButton from './TalkToAgentButton';
import AgentIcon from '@/app/components/chat/AgentIcon';
import agentService from '@/services/agentService';
import configService from '@/services/configService';
import { Agent } from '@/app/types';
import {
  ShieldExclamationIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  HandRaisedIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface CrimeCardProps {
  id: string | number;
  name: string;
  count: number;
  color: string;
  type: string;
  onClick?: () => void;
  selected?: boolean;
  showAgentButton?: boolean;
}

const CrimeCard: React.FC<CrimeCardProps> = ({
  id,
  name,
  count,
  color,
  type,
  onClick,
  selected = false,
  showAgentButton = true,
}) => {
  const [assignedAgents, setAssignedAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch assigned agents for this crime type
  useEffect(() => {
    const fetchAssignedAgents = async () => {
      setIsLoading(true);
      try {
        // Get enabled agents
        const enabledAgents = await agentService.getEnabledAgents();

        // Get all agents
        const defaultSettings = configService.getDefaultSettings();
        const allAgents = defaultSettings.agentTypes;

        // Filter agents that are enabled and match this crime type
        const matchingAgents = allAgents.filter(agent => {
          // Check if agent is explicitly enabled (must be true)
          if (enabledAgents[agent.id] !== true) return false;

          // Check if agent is for this crime type
          if (agent.crimeType === type) return true;

          // For agents without specific crime type, check if they're assigned to this type
          if (!agent.crimeType) {
            const assignments = defaultSettings.agentAssignments;
            return Object.entries(assignments).some(([crimeId, agentId]) => {
              return crimeId === type && agentId === agent.id;
            });
          }

          return false;
        });

        setAssignedAgents(matchingAgents);
      } catch (error) {
        console.error(`Failed to fetch assigned agents for ${type}:`, error);
        setAssignedAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedAgents();
  }, [type]);

  // Get the appropriate icon based on the crime type
  const getIcon = () => {
    switch (type) {
      case 'theft':
        return <ShieldExclamationIcon className="h-5 w-5" />;
      case 'chain-snatching':
        return <LinkIcon className="h-5 w-5" />;
      case 'murder':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'accident':
        return <TruckIcon className="h-5 w-5" />;
      case 'abuse':
        return <HandRaisedIcon className="h-5 w-5" />;
      case 'financial-fraud':
        return <CurrencyDollarIcon className="h-5 w-5" />;
      case 'exchange-matching':
        return <ArrowsRightLeftIcon className="h-5 w-5" />;
      default:
        return <ShieldExclamationIcon className="h-5 w-5" />;
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{name}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${color}`}>
              Cases
            </span>
          </div>
          <div className="mt-1">
            {getIcon()}
          </div>
        </div>

        {/* Display assigned agents */}
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Assigned Agents:</p>
          {assignedAgents.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs"
                >
                  <span className={`mr-1 rounded-full p-1 ${agent.avatarColor || 'bg-blue-700'}`}>
                    <AgentIcon agentType={agent.id} className="h-3 w-3 text-white" />
                  </span>
                  <span className="font-medium">{agent.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No agents assigned</p>
          )}
        </div>

        {showAgentButton && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <TalkToAgentButton
              crimeType={type}
              caseTitle={`${name} Investigation`}
              size="sm"
              variant="outline"
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrimeCard;
