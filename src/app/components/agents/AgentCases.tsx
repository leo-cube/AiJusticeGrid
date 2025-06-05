/* eslint-disable */
'use client';

import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Agent, Case } from '@/app/types';
import { useChat } from '@/app/context/ChatContext';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

// Mock cases data - in a real app, this would come from an API
const mockCases: Record<string, Case[]> = {
  'crime': [
    { id: 'C-1001', name: 'Downtown Robbery', assignedTo: 'Officer Johnson', status: 'open' },
    { id: 'C-1002', name: 'Mall Theft', assignedTo: 'Officer Smith', status: 'in-progress' },
  ],
  'murder': [
    { id: 'C-2001', name: 'Riverside Homicide', assignedTo: 'Detective Brown', status: 'open' },
    { id: 'C-2002', name: 'Hotel Murder Case', assignedTo: 'Detective Williams', status: 'in-progress' },
  ],
  'theft': [
    { id: 'C-3001', name: 'Jewelry Store Theft', assignedTo: 'Officer Davis', status: 'open' },
    { id: 'C-3002', name: 'Bank Robbery', assignedTo: 'Officer Miller', status: 'closed' },
  ],
  'financial-fraud': [
    { id: 'C-4001', name: 'Credit Card Fraud Ring', assignedTo: 'Agent Wilson', status: 'in-progress' },
    { id: 'C-4002', name: 'Investment Scam', assignedTo: 'Agent Moore', status: 'open' },
  ],
  'exchange-matching': [
    { id: 'C-5001', name: 'Stock Exchange Mismatch', assignedTo: 'Analyst Taylor', status: 'in-progress' },
    { id: 'C-5002', name: 'Currency Exchange Fraud', assignedTo: 'Analyst Anderson', status: 'closed' },
  ],
  'smuggle': [
    { id: 'C-6001', name: 'Harbor Smuggling Operation', assignedTo: 'Officer Thomas', status: 'open' },
    { id: 'C-6002', name: 'Border Contraband', assignedTo: 'Officer Jackson', status: 'in-progress' },
  ],
};

// Status color mapping
const statusColors = {
  'open': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'closed': 'bg-green-100 text-green-800',
};

interface AgentCasesProps {
  agent: Agent;
}

const AgentCases: React.FC<AgentCasesProps> = ({ agent }) => {
  const [expanded, setExpanded] = useState(false);
  const { setCurrentAgent, toggleChat } = useChat();
  
  // Get cases for this agent type, fallback to empty array if none found
  const cases = mockCases[agent.id] || [];
  
  // Handle chat with agent
  const handleChatWithAgent = () => {
    setCurrentAgent(agent.id as any, {
      agentName: agent.name,
      agentType: agent.type,
    });
    toggleChat();
  };

  return (
    <Card>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className={`h-10 w-10 rounded-full ${agent.avatarColor} flex items-center justify-center text-white`}>
            {agent.name.charAt(0)}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-500">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleChatWithAgent();
            }}
            className="rounded-full p-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </button>
          {expanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {expanded && (
        <CardContent className="border-t border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-3">Assigned Cases</h4>
          {cases.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No cases assigned</p>
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="bg-white rounded-md border p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{caseItem.name}</p>
                      <p className="text-sm text-gray-500">ID: {caseItem.id} • Assigned to: {caseItem.assignedTo}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[caseItem.status as keyof typeof statusColors]}`}>
                      {caseItem.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Agent Capabilities</h4>
            <div className="grid grid-cols-2 gap-2">
              {agent.capabilities.map((capability, index) => (
                <div key={index} className="bg-white rounded-md border p-2 text-sm">
                  {capability}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AgentCases;
