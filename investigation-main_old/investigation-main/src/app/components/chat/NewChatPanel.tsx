'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import ChatMessageItem from './ChatMessageItem';
import AgentIcon from './AgentIcon';
import WelcomeScreen from './WelcomeScreen';
import { useChat } from '@/app/context/ChatContext';
import { AgentType, ChatContextType } from '@/app/types';
import { defaultAgents } from './AgentSelector';
import suggestedQuestionsService from '@/services/suggestedQuestionsService';

interface NewChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const NewChatPanel: React.FC<NewChatPanelProps> = ({ isOpen, onToggle }) => {
  const {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    currentAgent,
    selectedAgents,
    setCurrentAgent,
    selectAgent,
    deselectAgent
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [agentSelectorOpen, setAgentSelectorOpen] = useState(false);
  const [subAgentSelectorOpen, setSubAgentSelectorOpen] = useState<Record<string, boolean>>({});

  // Get the current agent details
  const activeAgent = defaultAgents.find(agent => agent.id === currentAgent) || defaultAgents[0];

  // Get all available agents
  const allAgents = defaultAgents;

  // Group agents by type
  const mainAgents = allAgents.filter(agent => !agent.parentType);
  const subAgents = allAgents.filter(agent => agent.parentType);

  // Group sub-agents by parent type
  const subAgentsByParent: Record<string, typeof allAgents> = {};
  subAgents.forEach(agent => {
    if (agent.parentType) {
      if (!subAgentsByParent[agent.parentType]) {
        subAgentsByParent[agent.parentType] = [];
      }
      subAgentsByParent[agent.parentType].push(agent);
    }
  });

  // Toggle sub-agent selector
  const toggleSubAgentSelector = (parentType: string) => {
    setSubAgentSelectorOpen(prev => ({
      ...prev,
      [parentType]: !prev[parentType]
    }));
  };

  // Handle agent selection
  const handleAgentSelect = (agentType: AgentType) => {
    setCurrentAgent(agentType);
  };

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

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed inset-y-0 right-0 z-20 flex w-96 flex-col bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Chat header */}
        <div className="flex flex-col border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat Assistant</h2>
            <button
              onClick={onToggle}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Close chat"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="px-4 pb-2 text-sm text-gray-500">Multi-agent chat system for specialized investigations</p>

          {/* Agent selector toggle */}
          <div
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
            onClick={() => setAgentSelectorOpen(!agentSelectorOpen)}
          >
            <span className="text-sm font-medium text-gray-700">
              {agentSelectorOpen ? 'Hide Investigation Agents' : 'Select Investigation Agents'}
            </span>
            {agentSelectorOpen ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {/* Agent selector */}
          {agentSelectorOpen && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-2">
                {mainAgents.map(agent => (
                  <div key={agent.id} className="space-y-2">
                    {/* Main agent button */}
                    <button
                      onClick={() => handleAgentSelect(agent.id as AgentType)}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                        currentAgent === agent.id
                          ? `${agent.avatarColor} text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <AgentIcon agentType={agent.id as AgentType} className="mr-2" />
                      {agent.name}
                    </button>

                    {/* Sub-agents if this agent has any */}
                    {subAgentsByParent[agent.id] && subAgentsByParent[agent.id].length > 0 && (
                      <>
                        {/* Sub-agent toggle */}
                        {subAgentSelectorOpen[agent.id] ? (
                          <div className="pl-4 space-y-1">
                            {subAgentsByParent[agent.id].map(subAgent => (
                              <button
                                key={subAgent.id}
                                onClick={() => handleAgentSelect(subAgent.id as AgentType)}
                                className={`flex w-full items-center rounded-md px-3 py-1.5 text-sm font-medium ${
                                  currentAgent === subAgent.id
                                    ? `${subAgent.avatarColor} text-white`
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <AgentIcon agentType={subAgent.id as AgentType} className="mr-2" />
                                {subAgent.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleSubAgentSelector(agent.id)}
                            className="flex w-full items-center justify-between pl-8 pr-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            <span>{agent.name} sub-agents</span>
                            <ChevronDownIcon className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active agent header */}
          <div className={`flex items-center justify-between p-4 ${activeAgent.avatarColor}`}>
            <div className="flex items-center">
              <AgentIcon agentType={activeAgent.id as AgentType} className="text-white" />
              <span className="ml-2 text-sm font-medium text-white">{activeAgent.name}</span>
            </div>
            <div className="flex items-center">
              <span className="flex h-2 w-2 rounded-full bg-green-300"></span>
              <span className="ml-1 text-xs text-white">Online</span>
            </div>
          </div>
        </div>

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
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${activeAgent.name} about investigations, evidence, or cases...`}
              className="flex-1 border-0 bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-0"
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
                <PaperAirplaneIcon className="h-4 w-4 -rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay (visible when chat is open on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black bg-opacity-25 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default NewChatPanel;
