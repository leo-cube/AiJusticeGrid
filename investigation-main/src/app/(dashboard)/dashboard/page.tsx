/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import configService from '@/services/configService';
import defaultSettings from '@/config/defaultSettings.json';
import { Agent } from '@/app/types';

// Import API services
import { apiService } from '@/services/api';

export default function DashboardPage() {
  const [selectedStat, setSelectedStat] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for dashboard data
  const [stats, setStats] = useState<any[]>([]);
  const [caseTrends, setCaseTrends] = useState<any[]>([]);
  const [crimeCategories, setCrimeCategories] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [priorityCases, setPriorityCases] = useState<any[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get endpoints from config
        const dashboardEndpoint = defaultSettings.api.endpoints.dashboard;
        const agentsEndpoint = defaultSettings.api.endpoints.agents;

        // Fetch dashboard data and agents from API
        const dashboardData = await apiService.get(dashboardEndpoint);
        const agentsData = await apiService.get(agentsEndpoint);

        // Update state with fetched data
        if (dashboardData) {
          setStats(dashboardData.stats || []);
          setCaseTrends(dashboardData.caseTrends || []);
          setCrimeCategories(dashboardData.crimeCategories || []);
          setRecentActivity(dashboardData.recentActivity || []);
          setPriorityCases(dashboardData.priorityCases || []);
        }

        // Update agents state
        if (agentsData) {
          setAgents(agentsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');

        // Fall back to default settings if API fails
        const mockDashboard = await import('@/mocks/api').then(module => module.default['/dashboard']);

        if (mockDashboard) {
          setStats(mockDashboard.stats || []);
          setCaseTrends(mockDashboard.caseTrends || []);
          setCrimeCategories(mockDashboard.crimeCategories || []);
          setRecentActivity(mockDashboard.recentActivity || []);
          setPriorityCases(mockDashboard.priorityCases || []);
        }

        // Fall back to default agents
        setAgents(defaultSettings.agentTypes);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Set up refresh interval based on configuration
    const refreshInterval = defaultSettings.ui.dashboard.refreshInterval || 60000;
    const intervalId = setInterval(fetchDashboardData, refreshInterval);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleStatClick = (statId: number) => {
    setSelectedStat(selectedStat === statId ? null : statId);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-6 h-32"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-gray-100 rounded-lg p-6 h-64"></div>
        <div className="bg-gray-100 rounded-lg p-6 h-64"></div>
      </div>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ message }: { message: string }) => (
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
  if (isLoading && stats.length === 0) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error && stats.length === 0) {
    return <ErrorMessage message={error} />;
  }

  // Render icons based on icon name from API
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'ChartBarIcon':
        return <ChartBarIcon className="h-6 w-6 text-blue-600" />;
      case 'DocumentTextIcon':
        return <DocumentTextIcon className="h-6 w-6 text-red-600" />;
      case 'CurrencyDollarIcon':
        return <CurrencyDollarIcon className="h-6 w-6 text-green-600" />;
      case 'ArrowsRightLeftIcon':
        return <ArrowsRightLeftIcon className="h-6 w-6 text-purple-600" />;
      default:
        return <ChartBarIcon className="h-6 w-6 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to the Police Investigation System</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.id}>
            <Card
              className={`${stat.clickable ? 'cursor-pointer transition-all hover:shadow-md' : ''}`}
              onClick={() => stat.clickable && handleStatClick(stat.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="rounded-full bg-gray-100 p-3">
                    {typeof stat.icon === 'string' ? renderIcon(stat.icon) : stat.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {stat.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={`ml-1 text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {stat.change}%
                  </span>
                  <span className="ml-1 text-sm text-gray-500">from last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Show case trends when Active Investigations is clicked */}
            {selectedStat === 1 && stat.id === 1 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Case Status and Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {caseTrends.map((trend) => (
                      <div key={trend.id} className="rounded-lg border p-4">
                        <p className="text-sm font-medium text-gray-500">{trend.name}</p>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{trend.count}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${trend.color}`}>
                          {trend.name === 'Solving' ? 'Positive' : trend.name === 'Losing' ? 'Negative' : 'No Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show crime categories when Crimes Reported is clicked */}
            {selectedStat === 2 && stat.id === 2 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Crime Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {crimeCategories.map((category) => (
                      <div key={category.id} className="rounded-lg border p-4">
                        <p className="text-sm font-medium text-gray-500">{category.name}</p>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{category.count}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${category.color}`}>
                          Cases
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center text-gray-500">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-medium text-blue-600">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityCases.length === 0 ? (
              <p className="text-center text-gray-500">No priority cases</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="px-2 py-3">Case ID</th>
                      <th className="px-2 py-3">Type</th>
                      <th className="px-2 py-3">Priority</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {priorityCases.map((caseItem) => (
                      <tr key={caseItem.id} className="text-sm text-gray-900">
                        <td className="whitespace-nowrap px-2 py-3 font-medium">
                          {caseItem.id}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3">{caseItem.type}</td>
                        <td className="whitespace-nowrap px-2 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              caseItem.priority === 'High'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {caseItem.priority}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              caseItem.status === 'Open'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {caseItem.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-3">{caseItem.assignedTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
