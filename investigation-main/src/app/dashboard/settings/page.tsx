/* eslint-disable */
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import AugmentAIConfig from '@/app/components/settings/AugmentAIConfig';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    badgeNumber: user?.badgeNumber || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Show success message
      setMessage({
        type: 'success',
        text: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and application settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'agents'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('agents')}
            >
              Agent Configuration
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'augment'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('augment')}
            >
              Augment AI
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {message.text && (
                <div
                  className={`p-4 rounded-md ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="name"
                  name="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  id="department"
                  name="department"
                  label="Department"
                  value={formData.department}
                  onChange={handleInputChange}
                />
                <Input
                  id="badgeNumber"
                  name="badgeNumber"
                  label="Badge Number"
                  value={formData.badgeNumber}
                  onChange={handleInputChange}
                />
                <Button type="submit" isLoading={isLoading}>
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-6">
              <p className="text-gray-500">
                Configure agent settings and behavior
              </p>
              {/* Agent configuration panel would go here */}
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <p>Agent configuration is currently under development.</p>
              </div>
            </div>
          )}

          {activeTab === 'augment' && <AugmentAIConfig />}
        </CardContent>
      </Card>
    </div>
  );
}
