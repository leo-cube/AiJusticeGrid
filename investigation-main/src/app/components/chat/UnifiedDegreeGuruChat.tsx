'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ChatMessageItem from './ChatMessageItem';
import AgentIcon from './AgentIcon';
import WelcomeScreen from './WelcomeScreen';
import { useChat } from '@/app/context/ChatContext';
import { AgentType, ChatContextType } from '@/app/types';
import { defaultAgents } from './AgentSelector';
import suggestedQuestionsService from '@/services/suggestedQuestionsService';
import Button from '@/app/components/ui/Button';

interface UnifiedAgentChatProps {
  className?: string;
  agentType?: AgentType;
  context?: ChatContextType;
}

const UnifiedAgentChat: React.FC<UnifiedAgentChatProps> = ({
  className = '',
  agentType = 'degree-guru',
  context
}) => {
  const {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    currentAgent,
    setCurrentAgent
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Set the current agent when the component mounts
  useEffect(() => {
    if (agentType) {
      setCurrentAgent(agentType, context);
    }
  }, [agentType, context, setCurrentAgent]);

  // Get the current agent details
  const activeAgent = defaultAgents.find(agent => agent.id === currentAgent) ||
                     defaultAgents.find(agent => agent.id === 'degree-guru') ||
                     defaultAgents[0];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch suggested questions when the component mounts or agent changes
  useEffect(() => {
    const fetchSuggestedQuestions = async () => {
      try {
        console.log(`Fetching suggested questions for agent: ${currentAgent}`);
        const questions = await suggestedQuestionsService.getSuggestedQuestions(currentAgent);
        console.log('Received suggested questions:', questions);

        if (Array.isArray(questions) && questions.length > 0) {
          setSuggestedQuestions(questions);
        } else {
          console.warn('Received empty or invalid questions array, using fallback questions');
          setSuggestedQuestions([
            'What can you help me with?',
            'How do I use this system?',
            'What are your capabilities?',
            'Tell me about this application'
          ]);
        }
      } catch (error) {
        console.error('Error fetching suggested questions:', error);
        setSuggestedQuestions([
          'What can you help me with?',
          'How do I use this system?',
          'What are your capabilities?',
          'Tell me about this application'
        ]);
      }
    };

    fetchSuggestedQuestions();
  }, [currentAgent]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setInputValue('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleClearChat = () => {
    clearMessages();
  };

  const handleClose = () => {
    router.back();
  };

  // Filter messages for the current agent
  const filteredMessages = messages.filter(
    message => message.agentType === currentAgent
  );

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className={`p-4 rounded-t-lg flex justify-between items-center ${activeAgent.avatarColor.replace('bg-', 'bg-').replace('-700', '-50')}`}>
        <div className="flex items-center">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activeAgent.avatarColor}`}>
            <AgentIcon agentType={currentAgent} className="text-white" />
          </div>
          <div className="ml-3">
            <h3 className="text-base font-medium">Agent</h3>
            <p className="text-sm text-gray-600">
              {activeAgent.id === 'degree-guru'
                ? 'Your ultimate companion in navigating the academic landscape'
                : `Currently acting as: ${activeAgent.name}`}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleClearChat}
            className="p-1 rounded-full hover:bg-gray-200"
            title="Clear chat"
          >
            <TrashIcon className="h-5 w-5 text-gray-500" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-200"
            title="Close chat"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length === 0 ? (
          <WelcomeScreen agentType={currentAgent} onSendMessage={handleSendMessage} />
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isTyping={isTyping && message.id === filteredMessages[filteredMessages.length - 1]?.id}
              />
            ))}
            {isTyping && filteredMessages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="ml-2 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAgentChat;
