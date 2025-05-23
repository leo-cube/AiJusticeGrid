'use client';

import React from 'react';
import { ChatMessage } from '@/app/types';
import {
  CheckIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { defaultAgents } from './AgentSelector';
import AgentIcon from './AgentIcon';

interface ChatMessageItemProps {
  message: ChatMessage;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusIcon = () => {
    if (message.status === 'sent') {
      return <CheckIcon className="h-3 w-3 text-gray-400" />;
    } else if (message.status === 'delivered') {
      return <CheckIcon className="h-3 w-3 text-blue-500" />;
    } else if (message.status === 'read') {
      return <CheckCircleIcon className="h-3 w-3 text-blue-500" />;
    }
    return null;
  };

  // Function to format message content with proper line breaks
  const formatContent = (content: string) => {
    // Check if this is a Murder agent message with live data
    const isMurderAgent = !isUser &&
      (message.agentType === 'murder' ||
       message.agentType === 'murder-chief' ||
       message.agentType === 'murder-cop-2' ||
       message.agentType === 'murder-case-3');

    const hasLiveData = isMurderAgent && message.context?.usingLiveBackend;

    // If it's a Murder agent with live data, add a badge at the top
    if (hasLiveData && content.includes('**[LIVE DATA ANALYSIS]**')) {
      // Replace the marker with a styled badge
      content = content.replace('**[LIVE DATA ANALYSIS]**', '');

      // Format the content for better readability
      // Check if this is a greeting/question from the Murder Agent
      if (message.context?.isCollectingInfo && message.context?.currentStep) {
        // This is a question from the Murder Agent, make it stand out
        return (
          <>
            <div className="mb-2 inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
              Live Data Analysis
            </div>
            <div className="font-medium mb-2">{content}</div>
            {message.context.currentStep !== 'analysis' && (
              <div className="text-xs text-gray-500 mt-1">
                Please answer the question to continue the investigation.
              </div>
            )}
          </>
        );
      }

      // Regular live data analysis
      return (
        <>
          <div className="mb-2 inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
            Live Data Analysis
          </div>
          {content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </>
      );
    }

    // Regular formatting for other messages
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Get agent details
  const agent = !isUser ? defaultAgents.find(a => a.id === message.agentType) || defaultAgents[0] : null;

  // Get case details from context
  const caseDetails = !isUser && message.context ? message.context : null;

  // Get agent name from context if available, otherwise use agent name from defaultAgents
  const agentName = !isUser && caseDetails && caseDetails.agentName
    ? caseDetails.agentName
    : agent?.name || "Assistant";

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}>
      {/* Message content */}
      <div className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
        {!isUser && (
          <div className="mr-2 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <AgentIcon
                agentType={agent?.id || 'general'}
                className={agent?.avatarColor ? agent.avatarColor.replace('bg-', 'text-') : 'text-blue-600'}
              />
            </div>
          </div>
        )}

        <div className={`max-w-[85%] ${isUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-900'}`}>
          {/* Agent name and live data indicator (for assistant messages only) */}
          {!isUser && agent && (
            <div className="flex items-center px-4 pt-2">
              <span className="text-sm font-medium">
                {agentName}
              </span>

              {/* Show live backend indicator for Murder agent */}
              {!isUser &&
              (message.agentType === 'murder' ||
                message.agentType === 'murder-chief' ||
                message.agentType === 'murder-cop-2' ||
                message.agentType === 'murder-case-3') &&
              caseDetails?.usingLiveBackend && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full flex items-center">
                  Live Data
                </span>
              )}
            </div>
          )}

          {/* Message content */}
          <div className="px-4 py-2 text-sm">
            {formatContent(message.content)}
          </div>

          {/* Case details for assistant messages */}
          {!isUser && caseDetails && (caseDetails.caseId || caseDetails.caseName || caseDetails.caseStatus) && (
            <div className="border-t border-gray-100 px-4 py-1 text-xs text-gray-500">
              Case Details: {caseDetails.caseId || 'N/A'} | {caseDetails.caseName || 'Homicide Case'} |
              Priority: {caseDetails.casePriority || 'High'} | Status: {caseDetails.caseStatus || 'Open'}
            </div>
          )}

          {/* Timestamp */}
          <div className="px-4 pb-2 text-right">
            <span className={`text-xs ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>

        {isUser && (
          <div className="ml-2 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <UserCircleIcon className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageItem;
