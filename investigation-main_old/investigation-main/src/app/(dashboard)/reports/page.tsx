/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ApiReportPanel from '@/app/components/reports/ApiReportPanel';
import ApiReportForm from '@/app/components/reports/ApiReportForm';
import { ApiReport } from '@/app/types';
import { apiService } from '@/services/api';
import defaultSettings from '@/config/defaultSettings.json';
import {
  DocumentTextIcon,
  ServerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon
} from '@heroicons/react/24/outline';



export default function ReportsPage() {
  const [apiReports, setApiReports] = useState<ApiReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApiReports, setShowApiReports] = useState(true);
  const [showApiReportForm, setShowApiReportForm] = useState(false);

  // Fetch API reports
  useEffect(() => {
    const fetchApiReports = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get API reports endpoint from config
        const apiReportsEndpoint = defaultSettings.api.endpoints.apiReports;

        // Fetch API reports from API
        const apiReportsData = await apiService.get<ApiReport[]>(apiReportsEndpoint);

        // Update state with fetched data
        if (apiReportsData) {
          setApiReports(apiReportsData);
        }
      } catch (error) {
        console.error('Error fetching API reports:', error);
        setError('Failed to load API reports. Please try again later.');

        // Fall back to mock data if API fails
        const mockApiReportsModule = await import('@/app/api/api-reports/route');
        if (mockApiReportsModule) {
          setApiReports((mockApiReportsModule as any).mockApiReports || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiReports();
  }, []);



  // Handle API report form submission
  const handleApiReportSubmit = (report: ApiReport) => {
    setApiReports([report, ...apiReports]);
    setShowApiReportForm(false);
  };

  // Handle API report form cancel
  const handleApiReportCancel = () => {
    setShowApiReportForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Reports</h1>
          <p className="text-gray-500">View and manage API-generated reports with designated panels</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setShowApiReports(!showApiReports)}
          >
            <ServerIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Available Reports</h2>
            {showApiReports ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400 ml-2" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400 ml-2" />
            )}
          </div>
          <Button
            onClick={() => setShowApiReportForm(true)}
            disabled={showApiReportForm}
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            New Report
          </Button>
        </div>

        {showApiReportForm ? (
          <ApiReportForm
            onSubmit={handleApiReportSubmit}
            onCancel={handleApiReportCancel}
          />
        ) : showApiReports && (
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-gray-500">Loading API reports...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-red-500">{error}</p>
                  <Button
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : apiReports.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-gray-500">No API reports available</p>
                </CardContent>
              </Card>
            ) : (
              apiReports.map((report) => (
                <ApiReportPanel key={report.id} report={report} />
              ))
            )}
          </div>
        )}
      </div>


    </div>
  );
}
