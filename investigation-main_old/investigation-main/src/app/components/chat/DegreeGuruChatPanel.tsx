'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useChat } from '@/app/context/ChatContext';

interface DegreeGuruChatPanelProps {
  className?: string;
}

const DegreeGuruChatPanel: React.FC<DegreeGuruChatPanelProps> = ({ className = '' }) => {
  const {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    currentAgent,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Predefined questions based on the image
  const suggestedQuestions = [
    'Are there resources for students interested in creative writing?',
    'Are there any workshops or seminars on entrepreneurship for students?',
    'Are there courses on environmental sustainability?',
    'What kinds of courses will I take as a philosophy major?'
  ];

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-green-50 p-4 rounded-t-lg">
        <div className="flex items-center">
          <div className="bg-green-700 h-8 w-8 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">G</span>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-medium">Welcome to DegreeGuru</h3>
            <p className="text-sm text-gray-600">Your ultimate companion in navigating the academic landscape of Stanford.</p>
          </div>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
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

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Your question..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="ml-2 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          This project is a prototype for a RAG chatbot. Built using LangChain, Upstash Vector and Vercel AI SDK · <a href="#" className="text-blue-600 hover:underline">Source Code</a>
        </div>
      </div>
    </div>
  );
};

export default DegreeGuruChatPanel;
