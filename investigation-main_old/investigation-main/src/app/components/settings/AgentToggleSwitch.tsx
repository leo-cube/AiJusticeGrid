'use client';

import React, { useState } from 'react';
import agentToggleService from '@/services/agentToggleService';

interface AgentToggleSwitchProps {
  agentId: string;
  initialEnabled: boolean;
  onToggle?: (agentId: string, enabled: boolean) => void;
}

const AgentToggleSwitch: React.FC<AgentToggleSwitchProps> = ({
  agentId,
  initialEnabled,
  onToggle
}) => {
  // Ensure initialEnabled is treated as a boolean
  const [enabled, setEnabled] = useState(initialEnabled === true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the API to toggle the agent
      const newEnabled = !enabled;
      await agentToggleService.toggleAgent(agentId, newEnabled);

      // Update the local state
      setEnabled(newEnabled);

      // Call the onToggle callback if provided
      if (onToggle) {
        onToggle(agentId, newEnabled);
      }
    } catch (err) {
      console.error(`Error toggling agent ${agentId}:`, err);
      setError('Failed to toggle agent. Please try again.');
      // Don't update the UI state if there was an error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center">
      <label
        className={`relative inline-flex cursor-pointer items-center ml-4 ${isLoading ? 'opacity-50' : ''}`}
        title={error || ''}
      >
        <input
          className="peer sr-only"
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          disabled={isLoading}
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
      </label>
      {error && (
        <span className="ml-2 text-xs text-red-500">{error}</span>
      )}
    </div>
  );
};

export default AgentToggleSwitch;
