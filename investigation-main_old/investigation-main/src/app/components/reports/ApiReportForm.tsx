/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { ApiReport, DesignatedPanel, Case } from '@/app/types';
import { apiService } from '@/services/api';
import defaultSettings from '@/config/defaultSettings.json';
import {
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ApiReportFormProps {
  onSubmit: (report: ApiReport) => void;
  onCancel: () => void;
}

const ApiReportForm: React.FC<ApiReportFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('');
  const [caseType, setCaseType] = useState('');
  const [panels, setPanels] = useState<Partial<DesignatedPanel>[]>([
    {
      title: 'Case Summary',
      type: 'summary',
      content: '',
      priority: 'medium',
    }
  ]);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cases for dropdown
  useEffect(() => {
    const fetchCases = async () => {
      try {
        // In a real application, this would fetch cases from the API
        // For now, we'll use mock data
        const mockCases = [
          { id: 'CR-1001', name: 'Bank Robbery', assignedTo: 'John Doe', status: 'open' },
          { id: 'CR-1002', name: 'Credit Card Fraud', assignedTo: 'Jane Smith', status: 'in-progress' },
          { id: 'murder-case-1', name: 'Murder Case 1', assignedTo: 'Police 1', status: 'open' },
        ];
        setCases(mockCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setError('Failed to load cases. Please try again later.');
      }
    };

    fetchCases();
  }, []);

  // Handle case selection
  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCaseId = e.target.value;
    setCaseId(selectedCaseId);
    
    // Find the case type based on the ID
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    if (selectedCase) {
      // In a real application, you would get the case type from the case object
      // For now, we'll infer it from the ID
      if (selectedCaseId.includes('murder')) {
        setCaseType('murder');
      } else if (selectedCaseId.includes('fraud')) {
        setCaseType('financial-fraud');
      } else if (selectedCaseId.includes('CR-1001')) {
        setCaseType('theft');
      } else {
        setCaseType('other');
      }
    }
  };

  // Add a new panel
  const addPanel = () => {
    setPanels([
      ...panels,
      {
        title: '',
        type: 'summary',
        content: '',
        priority: 'medium',
      }
    ]);
  };

  // Remove a panel
  const removePanel = (index: number) => {
    setPanels(panels.filter((_, i) => i !== index));
  };

  // Update panel field
  const updatePanelField = (index: number, field: keyof DesignatedPanel, value: any) => {
    const updatedPanels = [...panels];
    updatedPanels[index] = {
      ...updatedPanels[index],
      [field]: value,
    };
    setPanels(updatedPanels);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !caseId || !caseType) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get API reports endpoint from config
      const apiReportsEndpoint = defaultSettings.api.endpoints.apiReports;
      
      // Prepare the report data
      const reportData = {
        title,
        caseId,
        caseType,
        generatedBy: 'Current User', // In a real app, this would be the current user
        panels: panels.map((panel, index) => ({
          ...panel,
          id: `PANEL-NEW-${index + 1}`,
        })),
      };
      
      // Submit the report to the API
      const response = await apiService.post<ApiReport>(apiReportsEndpoint, reportData);
      
      // Call the onSubmit callback with the created report
      onSubmit(response);
    } catch (error) {
      console.error('Error creating API report:', error);
      setError('Failed to create API report. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create API Report</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Report Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">
              Case *
            </label>
            <select
              id="caseId"
              value={caseId}
              onChange={handleCaseChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select a case</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Designated Panels</h3>
              <Button
                type="button"
                size="sm"
                onClick={addPanel}
              >
                <PlusIcon className="mr-1 h-4 w-4" />
                Add Panel
              </Button>
            </div>
            
            <div className="mt-4 space-y-4">
              {panels.map((panel, index) => (
                <div key={index} className="rounded-md border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700">Panel {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removePanel(index)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={panel.title || ''}
                        onChange={(e) => updatePanelField(index, 'title', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type *
                      </label>
                      <select
                        value={panel.type || 'summary'}
                        onChange={(e) => updatePanelField(index, 'type', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="summary">Summary</option>
                        <option value="analysis">Analysis</option>
                        <option value="evidence">Evidence</option>
                        <option value="recommendations">Recommendations</option>
                        <option value="timeline">Timeline</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Content *
                      </label>
                      <textarea
                        value={panel.content || ''}
                        onChange={(e) => updatePanelField(index, 'content', e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        value={panel.priority || 'medium'}
                        onChange={(e) => updatePanelField(index, 'priority', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Assigned To
                      </label>
                      <input
                        type="text"
                        value={panel.assignedTo || ''}
                        onChange={(e) => updatePanelField(index, 'assignedTo', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApiReportForm;
