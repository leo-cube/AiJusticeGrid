/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ApiReportPanel from '@/app/components/reports/ApiReportPanel';
import ApiReportForm from '@/app/components/reports/ApiReportForm';
import InvestigationReportPanel from '@/app/components/reports/InvestigationReportPanel';
import { ApiReport, InvestigationReport } from '@/app/types';
import { apiService } from '@/services/api';
import defaultSettings from '@/config/defaultSettings.json';
import {
  DocumentTextIcon,
  ServerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';



export default function ReportsPage() {
  const [apiReports, setApiReports] = useState<ApiReport[]>([]);
  const [investigationReports, setInvestigationReports] = useState<InvestigationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInvestigations, setIsLoadingInvestigations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [showApiReports, setShowApiReports] = useState(true);
  const [showInvestigationReports, setShowInvestigationReports] = useState(true);
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

  // Fetch Investigation reports
  useEffect(() => {
    const fetchInvestigationReports = async () => {
      setIsLoadingInvestigations(true);
      setInvestigationError(null);

      try {
        // Fetch investigation reports from API
        const response = await fetch('/api/investigation-reports');

        if (!response.ok) {
          throw new Error('Failed to fetch investigation reports');
        }

        const data = await response.json();
        setInvestigationReports(data);
      } catch (error) {
        console.error('Error fetching investigation reports:', error);
        setInvestigationError('Failed to load investigation reports. Please try again later.');
      } finally {
        setIsLoadingInvestigations(false);
      }
    };

    fetchInvestigationReports();
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">View and manage all reports generated by the system</p>
        </div>
      </div>

      {/* Investigation Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setShowInvestigationReports(!showInvestigationReports)}
          >
            <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Investigation Reports</h2>
            {showInvestigationReports ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400 ml-2" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400 ml-2" />
            )}
          </div>
        </div>

        {showInvestigationReports && (
          <div className="space-y-4">
            {isLoadingInvestigations ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-gray-500">Loading investigation reports...</p>
                </CardContent>
              </Card>
            ) : investigationError ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-red-500">{investigationError}</p>
                  <Button
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : investigationReports.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-gray-500">No investigation reports available</p>
                </CardContent>
              </Card>
            ) : (
              investigationReports.map((report) => (
                <InvestigationReportPanel key={report.id} report={report} />
              ))
            )}
          </div>
        )}
      </div>

      {/* API Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setShowApiReports(!showApiReports)}
          >
            <ServerIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">API Reports</h2>
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
            New API Report
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
