'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ChatMessageItem from './ChatMessageItem';
import AgentSelector, { defaultAgents } from './AgentSelector';
import AgentIcon from './AgentIcon';
import WelcomeScreen from './WelcomeScreen';
import { useChat } from '@/app/context/ChatContext';

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onToggle }) => {
  const { messages, isTyping, sendMessage, clearMessages, currentAgent, setCurrentAgent } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the current agent details
  const activeAgent = defaultAgents.find(agent => agent.id === currentAgent) || defaultAgents[0];

  // Suggested questions
  const suggestedQuestions = [
    'Where did the recent financial fraud happen?',
    'Which stocks are being manipulated?',
    'What are the recent crime categories?',
    'What is the latest exchange match report?',
    'Can you recommend actions for the investigation?',
    'What money laundering patterns have been detected?',
    'Who are the main suspects in the fraud case?',
    'What is the timeline of the financial fraud?',
    'What evidence do we have in the fraud case?',
    'What legal regulations apply to this case?',
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      {/* Chat toggle button (visible when chat is closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          aria-label="Open chat"
        >
          <AgentIcon agentType="general" size="md" />
        </button>
      )}

      {/* Chat panel */}
      <div
        className={`fixed inset-y-0 right-0 z-20 flex w-96 flex-col bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Chat header */}
        <div className={`flex h-16 items-center justify-between border-b border-gray-200 px-4 text-white ${activeAgent.avatarColor || 'bg-blue-700'}`}>
          <div className="flex items-center">
            <AgentIcon agentType={activeAgent.id} className="text-white" />
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

            <button
              onClick={onToggle}
              className="rounded-md p-1 hover:bg-white hover:bg-opacity-20"
              aria-label="Close chat"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Agent selector */}
        <AgentSelector selectedAgent={currentAgent} onSelectAgent={setCurrentAgent} />

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
              placeholder="Ask about investigations, fraud patterns, or evidence..."
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

export default ChatPanel;
