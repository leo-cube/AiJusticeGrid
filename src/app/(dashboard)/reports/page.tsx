'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { DocumentTextIcon, ChartBarIcon, ArrowDownTrayIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { SavedPDFReport } from '@/app/types';

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('available-reports');
  const [savedReports, setSavedReports] = useState<SavedPDFReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // Track which report is being downloaded

  // Load saved reports function
  const loadSavedReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/saved-reports', {
        // Add cache busting to ensure fresh data
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const reports = await response.json();
        setSavedReports(reports);
        console.log('Loaded saved reports:', reports.length);
      } else {
        console.error('Failed to load saved reports');
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved reports on component mount
  useEffect(() => {
    loadSavedReports();
  }, []);

  // Refresh reports function
  const handleRefreshReports = () => {
    loadSavedReports();
  };

  // Handle downloading a saved PDF report
  const handleDownloadSavedReport = async (report: SavedPDFReport) => {
    setIsDownloading(report.id);

    try {
      console.log('Re-generating PDF for saved report:', report.id);

      // Call the PDF generation API with the stored conversation data
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report.conversationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('PDF downloaded successfully:', report.filename);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(null);
    }
  };

  // Handle deleting a saved report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-reports?id=${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the report from the local state
        setSavedReports(prev => prev.filter(report => report.id !== reportId));
        console.log('Report deleted successfully:', reportId);
      } else {
        throw new Error('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert(`Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Generate and manage investigation reports</p>
        </div>
        <Button>
          Generate New Report
        </Button>
      </div>

      {/* Tab Navigation - Only Available Reports */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('available-reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available-reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4 inline mr-1" />
            Available Reports
          </button>
        </nav>
      </div>

      {/* Available Reports Tab */}
      {activeTab === 'available-reports' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-semibold text-gray-900">{savedReports.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {savedReports.filter(report => {
                        const reportDate = new Date(report.createdDate);
                        const currentDate = new Date();
                        return reportDate.getMonth() === currentDate.getMonth() &&
                               reportDate.getFullYear() === currentDate.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ArrowDownTrayIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {savedReports.filter(report => report.status === 'generated').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saved Reports */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Saved PDF Reports</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshReports}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <ArrowPathIcon className="h-4 w-4" />
                  )}
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading saved reports...</p>
                </div>
              ) : savedReports.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
                  <p className="text-gray-600 mb-4">
                    Start a conversation with an agent and generate a PDF report to see it here.
                  </p>
                  <Button onClick={() => window.location.href = '/crime'}>
                    Start Agent Conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {report.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              report.status === 'generated'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {report.status === 'generated' ? 'Ready' : 'Error'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>ID: {report.id}</span>
                            <span>Agent: {report.agentType}</span>
                            <span>Date: {new Date(report.createdDate).toLocaleDateString()}</span>
                            {report.fileSize && (
                              <span>Size: {Math.round(report.fileSize / 1024)} KB</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadSavedReport(report)}
                            disabled={isDownloading === report.id}
                          >
                            {isDownloading === report.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
}
