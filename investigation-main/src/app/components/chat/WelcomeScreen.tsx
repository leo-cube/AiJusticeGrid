'use client';

import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { AgentType } from '@/app/types';
import welcomeScreenService, { WelcomeScreenContent } from '@/services/welcomeScreenService';

interface WelcomeScreenProps {
  agentType: AgentType;
  onQuestionClick: (question: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ agentType, onQuestionClick }) => {
  const [content, setContent] = useState<WelcomeScreenContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        // Get content from the service (now using predefined content)
        const data = await welcomeScreenService.getWelcomeScreenContent(agentType);
        setContent(data);
      } catch (error) {
        console.error('Error loading welcome screen content:', error);
        // Set default content in case of error
        setContent({
          title: 'Investigation Assistant',
          description: 'Expert guidance for your investigation needs.',
          icon: 'ChatBubbleLeftRightIcon',
          suggestedQuestions: [
            'What can you help me with?',
            'Tell me about the latest cases',
            'How do I analyze evidence?',
            'What investigation techniques should I use?'
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [agentType]);

  // Render the appropriate icon based on the icon name
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'ChatBubbleLeftRightIcon':
        return <ChatBubbleLeftRightIcon className="h-10 w-10 text-blue-700" />;
      case 'ShieldCheckIcon':
        return <ShieldCheckIcon className="h-10 w-10 text-blue-700" />;
      case 'ExclamationTriangleIcon':
        return <ExclamationTriangleIcon className="h-10 w-10 text-red-700" />;
      case 'CurrencyDollarIcon':
        return <CurrencyDollarIcon className="h-10 w-10 text-green-700" />;
      case 'ShieldExclamationIcon':
        return <ShieldExclamationIcon className="h-10 w-10 text-orange-700" />;
      case 'TruckIcon':
        return <TruckIcon className="h-10 w-10 text-purple-700" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-10 w-10 text-blue-700" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full p-3 bg-opacity-10 blue-700">
        {renderIcon(content.icon)}
      </div>
      <h3 className="text-lg font-medium text-gray-900">{content.title}</h3>
      <p className="mt-1 max-w-xs text-sm text-gray-500">{content.description}</p>
      <div className="mt-6 space-y-2">
        <p className="text-xs text-gray-500">Try asking:</p>
        {content.suggestedQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="block w-full rounded-md bg-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-200"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
