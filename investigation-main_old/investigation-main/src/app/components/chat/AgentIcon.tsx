'use client';

import React from 'react';
import { AgentType } from '@/app/types';
import {
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface AgentIconProps {
  agentType: AgentType | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AgentIcon: React.FC<AgentIconProps> = ({ agentType, size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const getIconByType = () => {
    // Handle murder-related agents
    if (agentType === 'murder' || agentType.startsWith('murder-')) {
      return <ExclamationTriangleIcon className={`${sizeClasses[size]} ${className}`} />;
    }

    // Handle crime-related agents
    if (agentType.startsWith('crime-')) {
      if (agentType === 'crime-accident') {
        return <TruckIcon className={`${sizeClasses[size]} ${className}`} />;
      }
      return <ShieldCheckIcon className={`${sizeClasses[size]} ${className}`} />;
    }

    // Handle other specific agent types
    switch (agentType) {
      case 'finance':
        return <CurrencyDollarIcon className={`${sizeClasses[size]} ${className}`} />;
      case 'theft':
        return <ShieldCheckIcon className={`${sizeClasses[size]} ${className}`} />;
      case 'smuggle':
        return <TruckIcon className={`${sizeClasses[size]} ${className}`} />;
      case 'general':
      default:
        return <ChatBubbleLeftRightIcon className={`${sizeClasses[size]} ${className}`} />;
    }
  };

  return getIconByType();
};

export default AgentIcon;
