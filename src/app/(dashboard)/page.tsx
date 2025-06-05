'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { ChartBarIcon, DocumentTextIcon, UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
// Removed unused import: defaultSettings

interface DashboardStats {
  id: number;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  clickable: boolean;
}

interface DashboardData {
  stats: DashboardStats[];
  recentCrimes: Record<string, unknown>[];
  agentStatus: Record<string, unknown>[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Generate mock dashboard data
      const mockData: DashboardData = {
        stats: [
          {
            id: 1,
            name: 'Active Investigations',
            value: Math.floor(Math.random() * 30) + 15,
            change: Math.floor(Math.random() * 20) - 5,
            changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
            icon: 'ChartBarIcon',
            clickable: true,
          },
          {
            id: 2,
            name: 'Crimes Reported',
            value: Math.floor(Math.random() * 40) + 20,
            change: Math.floor(Math.random() * 20) - 5,
            changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
            icon: 'DocumentTextIcon',
            clickable: true,
          },
          {
            id: 3,
            name: 'Cases Solved',
            value: Math.floor(Math.random() * 25) + 10,
            change: Math.floor(Math.random() * 15) + 1,
            changeType: 'increase',
            icon: 'UserGroupIcon',
            clickable: true,
          },
          {
            id: 4,
            name: 'High Priority',
            value: Math.floor(Math.random() * 8) + 2,
            change: Math.floor(Math.random() * 5) - 2,
            changeType: Math.random() > 0.3 ? 'increase' : 'decrease',
            icon: 'ExclamationTriangleIcon',
            clickable: true,
          },
        ],
        recentCrimes: [],
        agentStatus: []
      };

      setDashboardData(mockData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const iconClass = "h-8 w-8";
    switch (iconName) {
      case 'ChartBarIcon':
        return <ChartBarIcon className={iconClass} />;
      case 'DocumentTextIcon':
        return <DocumentTextIcon className={iconClass} />;
      case 'UserGroupIcon':
        return <UserGroupIcon className={iconClass} />;
      case 'ExclamationTriangleIcon':
        return <ExclamationTriangleIcon className={iconClass} />;
      default:
        return <ChartBarIcon className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'Officer'}
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s what&apos;s happening with your investigations today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData?.stats.map((stat) => (
          <Card key={stat.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <div className="text-blue-600">
                      {getIcon(stat.icon)}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <span
                      className={`text-sm font-medium ${
                        stat.changeType === 'increase'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.changeType === 'increase' ? '+' : ''}{stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last week</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Report New Crime</div>
                <div className="text-sm text-gray-600">File a new crime report</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">View Active Cases</div>
                <div className="text-sm text-gray-600">Check ongoing investigations</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Agent Analysis</div>
                <div className="text-sm text-gray-600">Get AI-powered insights</div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Murder Agent</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Theft Agent</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Standby
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Financial Fraud Agent</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Standby
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Database</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
