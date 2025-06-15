'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { CogIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import augmentAIService from '@/services/augmentAI';

interface AugmentAIConfigProps {
  className?: string;
}

interface BackendStatus {
  murder: boolean;
  financialFraud: boolean;
  lastChecked: string;
}

export default function AugmentAIConfig({ className = '' }: AugmentAIConfigProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    murder: false,
    financialFraud: false,
    lastChecked: ''
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    checkBackendStatus();
  }, []);

  const loadSettings = () => {
    try {
      // Load from environment variables or localStorage
      const enabledFromEnv = process.env.NEXT_PUBLIC_ENABLE_AUGMENT_AI === 'true';
      const enabledFromStorage = localStorage.getItem('augmentAI_enabled') === 'true';
      
      setIsEnabled(enabledFromEnv || enabledFromStorage);
      
      const storedApiKey = localStorage.getItem('augmentAI_apiKey') || 
                          process.env.NEXT_PUBLIC_AUGMENT_AI_API_KEY || '';
      setApiKey(storedApiKey);
      
      const storedEndpoint = localStorage.getItem('augmentAI_endpoint') || 
                            process.env.NEXT_PUBLIC_AUGMENT_AI_ENDPOINT || '/api/augment-ai';
      setEndpoint(storedEndpoint);
    } catch (error) {
      console.error('Error loading AugmentAI settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('augmentAI_enabled', isEnabled.toString());
      localStorage.setItem('augmentAI_apiKey', apiKey);
      localStorage.setItem('augmentAI_endpoint', endpoint);
      
      console.log('AugmentAI settings saved successfully');
      
      // Check backend status after saving
      if (isEnabled) {
        await checkBackendStatus();
      }
    } catch (error) {
      console.error('Error saving AugmentAI settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      const [murderStatus, financialFraudStatus] = await Promise.all([
        augmentAIService.checkMurderAgentBackend(),
        augmentAIService.checkFinancialFraudAgentBackend()
      ]);

      setBackendStatus({
        murder: murderStatus,
        financialFraud: financialFraudStatus,
        lastChecked: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Error checking backend status:', error);
      setBackendStatus({
        murder: false,
        financialFraud: false,
        lastChecked: new Date().toLocaleString()
      });
    } finally {
      setIsChecking(false);
    }
  };

  const resetToDefaults = () => {
    setIsEnabled(process.env.NEXT_PUBLIC_ENABLE_AUGMENT_AI === 'true');
    setApiKey(process.env.NEXT_PUBLIC_AUGMENT_AI_API_KEY || '');
    setEndpoint(process.env.NEXT_PUBLIC_AUGMENT_AI_ENDPOINT || '/api/augment-ai');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CogIcon className="h-5 w-5" />
            AugmentAI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable AugmentAI
              </label>
              <p className="text-xs text-gray-500">
                Enable AugmentAI features for enhanced investigation capabilities
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your AugmentAI API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API key is stored locally and never transmitted to our servers
            </p>
          </div>

          {/* Endpoint Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/augment-ai"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isEnabled}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="flex-1"
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backend Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Backend Status</span>
            <Button
              onClick={checkBackendStatus}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              {isChecking ? 'Checking...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Murder Agent Backend</span>
            <div className="flex items-center gap-2">
              {backendStatus.murder ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm ${backendStatus.murder ? 'text-green-600' : 'text-red-600'}`}>
                {backendStatus.murder ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Financial Fraud Agent Backend</span>
            <div className="flex items-center gap-2">
              {backendStatus.financialFraud ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm ${backendStatus.financialFraud ? 'text-green-600' : 'text-red-600'}`}>
                {backendStatus.financialFraud ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {backendStatus.lastChecked && (
            <p className="text-xs text-gray-500">
              Last checked: {backendStatus.lastChecked}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
