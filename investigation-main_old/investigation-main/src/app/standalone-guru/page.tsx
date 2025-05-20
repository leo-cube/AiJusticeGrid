'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
}

export default function StandaloneGuruPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(content),
        sender: 'assistant',
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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

  // Simple response generator
  const generateResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('creative writing')) {
      return "Yes, Stanford offers several resources for students interested in creative writing. The Creative Writing Program offers workshops in fiction, poetry, and creative non-fiction. The Stanford Storytelling Project and literary magazines like The Leland Quarterly also provide opportunities to develop your writing skills. The Hume Center for Writing and Speaking offers one-on-one tutoring sessions as well.";
    }
    
    if (lowerQuestion.includes('entrepreneurship') || lowerQuestion.includes('workshops') || lowerQuestion.includes('seminars')) {
      return "Stanford has numerous entrepreneurship resources! The Stanford Technology Ventures Program (STVP) offers workshops and seminars throughout the year. Stanford Entrepreneurship Network (SEN) hosts events connecting students with industry leaders. The Stanford d.school also offers design thinking workshops that are valuable for entrepreneurs. Additionally, check out the BASES student group which runs the Stanford Startup Challenge.";
    }
    
    if (lowerQuestion.includes('environmental') || lowerQuestion.includes('sustainability')) {
      return "Stanford offers many courses on environmental sustainability. The Earth Systems Program has courses like 'Environmental Science for Informed Citizens' and 'World Food Economy'. The Civil & Environmental Engineering department offers 'Environmental Engineering and Science'. The Woods Institute for the Environment also coordinates courses across departments. For a complete list, check the Stanford Bulletin under the 'Environment and Sustainability' section.";
    }
    
    if (lowerQuestion.includes('philosophy') || lowerQuestion.includes('major')) {
      return "As a philosophy major at Stanford, you'll take courses in several areas: history of philosophy (ancient, medieval, modern), logic and philosophy of science, ethics and value theory, and metaphysics and epistemology. Core requirements include PHIL 80 (Mind, Matter, and Meaning) and a logic course. You'll also take specialized seminars in your areas of interest, and complete a capstone project or honors thesis in your senior year.";
    }
    
    return "That's a great question about Stanford academics. I'd be happy to help you find more specific information about courses, majors, and resources available to students. Could you provide more details about what you're looking for?";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-xl">
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              This project is a prototype for a RAG chatbot. Built using LangChain, Upstash Vector and Vercel AI SDK · <a href="#" className="text-blue-600 hover:underline">Source Code</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
