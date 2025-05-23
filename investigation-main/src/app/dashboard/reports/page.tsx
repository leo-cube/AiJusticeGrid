/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import ApiReportPanel from '@/app/components/reports/ApiReportPanel';
import InvestigationReportPanel from '@/app/components/reports/InvestigationReportPanel';
import { apiService } from '@/services/api';
import defaultSettings from '@/config/defaultSettings.json';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('api');
  const [apiReports, setApiReports] = useState([]);
  const [investigationReports, setInvestigationReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get endpoints from config
        const apiReportsEndpoint = defaultSettings.api.endpoints.apiReports;
        const investigationReportsEndpoint = defaultSettings.api.endpoints.investigationReports;
        
        // Fetch reports from API
        const apiReportsData = await apiService.get(apiReportsEndpoint);
        const investigationReportsData = await apiService.get(investigationReportsEndpoint);
        
        if (apiReportsData) {
          setApiReports(apiReportsData);
        }
        
        if (investigationReportsData) {
          setInvestigationReports(investigationReportsData);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to load reports. Please try again later.');
        
        // Fall back to default settings if API fails
        const mockData = await import('@/mocks/api').then(module => module.default);
        setApiReports(mockData['/api-reports'] || []);
        setInvestigationReports(mockData['/investigation-reports'] || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
      </div>
      <div className="bg-gray-100 rounded-lg p-6 h-96"></div>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ message }) => (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
      <p className="text-red-800">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
      >
        Retry
      </button>
    </div>
  );

  // Show loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">View and manage reports</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'api'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('api')}
            >
              API Reports
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'investigation'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('investigation')}
            >
              Investigation Reports
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'api' ? (
            <ApiReportPanel reports={apiReports} />
          ) : (
            <InvestigationReportPanel reports={investigationReports} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
