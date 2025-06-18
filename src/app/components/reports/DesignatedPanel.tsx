/* eslint-disable */
'use client';

import React from 'react';
import { DesignatedPanel as DesignatedPanelType } from '@/app/types';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface DesignatedPanelProps {
  panel: DesignatedPanelType;
  onEdit?: (panel: DesignatedPanelType) => void;
}

const DesignatedPanel: React.FC<DesignatedPanelProps> = ({ panel, onEdit }) => {
  // Render icon based on panel type
  const renderIcon = () => {
    switch (panel.type) {
      case 'summary':
        return <DocumentTextIcon className="h-5 w-5 text-blue-600" />;
      case 'analysis':
        return <ChartBarIcon className="h-5 w-5 text-purple-600" />;
      case 'evidence':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
      case 'recommendations':
        return <LightBulbIcon className="h-5 w-5 text-yellow-600" />;
      case 'timeline':
        return <ClockIcon className="h-5 w-5 text-green-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get priority color
  const getPriorityColor = () => {
    switch (panel.priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2">{renderIcon()}</div>
            <CardTitle className="text-lg">{panel.title}</CardTitle>
          </div>
          {panel.priority && (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor()}`}>
              {panel.priority.charAt(0).toUpperCase() + panel.priority.slice(1)} Priority
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="whitespace-pre-line">{panel.content}</div>
        
        {panel.assignedTo && (
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <UserCircleIcon className="mr-1 h-4 w-4" />
            <span>Assigned to: {panel.assignedTo}</span>
          </div>
        )}
        
        {onEdit && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onEdit(panel)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit Panel
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignatedPanel;
