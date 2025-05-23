/* eslint-disable */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ChatMessageItem from './ChatMessageItem';
import AgentIcon from './AgentIcon';
import WelcomeScreen from './WelcomeScreen';
import { useChat } from '@/app/context/ChatContext';
import { AgentType, ChatContextType } from '@/app/types';
import { defaultAgents } from './AgentSelector';

interface EmbeddedChatPanelProps {
  className?: string;
}

const EmbeddedChatPanel: React.FC<EmbeddedChatPanelProps> = ({ className = '' }) => {
  const {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    currentAgent,
    selectedAgents,
    setCurrentAgent
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the current agent details
  const activeAgent = defaultAgents.find(agent => agent.id === currentAgent) || defaultAgents[0];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    await sendMessage(content);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleSetActiveAgent = (agentType: AgentType) => {
    setCurrentAgent(agentType);
  };

  return (
    <div className={`flex flex-col bg-white h-full ${className}`}>
      {/* Chat header */}
      <div className={`flex h-16 items-center justify-between border-b border-gray-200 px-4 text-white ${activeAgent.avatarColor || 'bg-blue-700'}`}>
        <div className="flex items-center">
          <AgentIcon agentType={activeAgent.id as AgentType} className="text-white" />
          <h2 className="ml-2 text-lg font-semibold">{activeAgent.name}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
          <span className="text-xs font-medium">Online</span>

          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="rounded-md p-1 hover:bg-white hover:bg-opacity-20"
              aria-label="Clear chat"
              title="Clear chat history"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Active agents tabs */}
      {selectedAgents.length > 0 && (
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
          {selectedAgents.map((agentType) => {
            const agent = defaultAgents.find(a => a.id === agentType);
            if (!agent) return null;

            return (
              <button
                key={agentType}
                onClick={() => handleSetActiveAgent(agentType)}
                className={`flex items-center whitespace-nowrap px-3 py-2 text-sm font-medium ${
                  currentAgent === agentType
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <AgentIcon
                  agentType={agentType}
                  className={`mr-1 ${
                    currentAgent === agentType
                      ? agent.avatarColor ? agent.avatarColor.replace('bg-', 'text-') : 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                />
                <span className="truncate max-w-[100px]">{agent.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <WelcomeScreen
            agentType={currentAgent}
            onQuestionClick={handleSendMessage}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex items-center">
                <div className="flex space-x-1 rounded-full bg-gray-200 px-4 py-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        {isTyping && (
          <div className="mb-2 text-xs text-gray-500">
            Assistant is typing...
          </div>
        )}
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activeAgent.name} about investigations, evidence, or cases...`}
            className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-0"
            rows={1}
          />
          <div className="px-2">
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                !inputValue.trim() || isTyping
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default EmbeddedChatPanel;
