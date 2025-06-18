'use client';

import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import AugmentAIConfig from '@/app/components/settings/AugmentAIConfig';
import { CogIcon, UserIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your system preferences and configurations</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
            Agent Configuration
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserIcon className="h-5 w-5 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BellIcon className="h-5 w-5 inline mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CogIcon className="h-5 w-5 inline mr-2" />
            System
          </button>
        </nav>
      </div>

      {/* Agent Configuration Tab */}
      {activeTab === 'agents' && (
        <div>
          <AugmentAIConfig />
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="Officer John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="admin@police.gov"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Number
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Criminal Investigation Division</option>
                  <option>Financial Crimes Unit</option>
                  <option>Homicide Division</option>
                  <option>Theft Division</option>
                </select>
              </div>
              <Button>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Case Updates</h4>
                  <p className="text-sm text-gray-500">Get notified when cases are updated</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Agent Responses</h4>
                  <p className="text-sm text-gray-500">Get notified when AI agents respond</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">System Alerts</h4>
                  <p className="text-sm text-gray-500">Get notified about system issues</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
                  <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Version</span>
                  <span className="text-sm text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">January 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Database Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">AI Services</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full">
                  Clear Cache
                </Button>
                <Button variant="outline" className="w-full">
                  Export Data
                </Button>
                <Button variant="outline" className="w-full">
                  System Diagnostics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
