'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import defaultSettings from '@/config/defaultSettings.json';

// Type definition for crime types
interface CrimeType {
  id: number;
  name: string;
  count: number;
  status: string;
  color?: string;
}

// Note: Settings response interface removed as it's not being used

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [crimeTypes, setCrimeTypes] = useState<CrimeType[]>([]);
  const [backgroundLoading, setBackgroundLoading] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState('/images/invest.jpg');
  const [demoCredentials, setDemoCredentials] = useState({
    email: 'admin@police.gov',
    password: 'password'
  });

  const router = useRouter();
  const { login } = useAuth();

  // Use mock data directly instead of making API calls that might fail
  useEffect(() => {
    const loadMockData = async () => {
      try {
        // Use default settings directly
        const defaultCrimeTypes = defaultSettings.crimeTypes || [];
        const backgroundImg = '/images/invest.jpg'; // Default background image

        // Set demo credentials from default settings
        const demoCredentialsData = {
          email: 'admin@police.gov',
          password: 'password'
        };

        // Set background image
        setBackgroundImage(backgroundImg);

        // Set demo credentials
        setDemoCredentials(demoCredentialsData);

        // Generate crime types with random counts
        setCrimeTypes(defaultCrimeTypes.map((type: { id: string; name: string; color?: string }, index: number) => {
          return {
            id: index + 1,
            name: type.name,
            color: type.color,
            // Use a deterministic count based on index to avoid random changes on refresh
            count: (index + 1) * 3 + 2,
            status: 'Active'
          };
        }));
      } catch (error) {
        console.error('Error loading mock data:', error);
        // Set minimal default data in case of error
        setCrimeTypes([
          { id: 1, name: 'Theft', count: 12, status: 'Active', color: 'bg-blue-100 text-blue-800' },
          { id: 2, name: 'Murder', count: 8, status: 'Active', color: 'bg-red-100 text-red-800' },
          { id: 3, name: 'Fraud', count: 15, status: 'Active', color: 'bg-green-100 text-green-800' },
          { id: 4, name: 'Accident', count: 10, status: 'Active', color: 'bg-yellow-100 text-yellow-800' },
          { id: 5, name: 'Abuse', count: 6, status: 'Active', color: 'bg-orange-100 text-orange-800' }
        ]);
      } finally {
        setBackgroundLoading(false);
      }
    };

    loadMockData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Attempt to login using the auth service
      const success = await login(email, password);

      if (success) {
        // Store mock crime counts in localStorage for potential offline use
        try {
          // Generate mock crime counts directly from default settings
          const crimeCounts = defaultSettings.crimeTypes.reduce((counts: Record<string, number>, type: { id: string }) => {
            counts[type.id] = Math.floor(Math.random() * 20) + 1;
            return counts;
          }, {});

          // Store in localStorage for offline access
          localStorage.setItem('crimeCounts', JSON.stringify(crimeCounts));
        } catch (error) {
          console.error('Error storing mock crime counts:', error);
          // Non-critical error, continue with navigation
        }

        // Navigate to dashboard
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Stylized crime types tabular column in the background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="bg-white bg-opacity-30 p-6 rounded-lg shadow-lg transform -rotate-6">
          {backgroundLoading ? (
            // Loading skeleton for background table
            <div className="animate-pulse">
              <div className="h-8 w-full bg-gray-300 mb-4"></div>
              <div className="h-6 w-full bg-gray-300 mb-2"></div>
              <div className="h-6 w-full bg-gray-300 mb-2"></div>
              <div className="h-6 w-full bg-gray-300 mb-2"></div>
              <div className="h-6 w-full bg-gray-300 mb-2"></div>
              <div className="h-6 w-full bg-gray-300"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-4 py-2 text-left text-white">Crime Type</th>
                  <th className="px-4 py-2 text-left text-white">Cases</th>
                  <th className="px-4 py-2 text-left text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {crimeTypes.slice(0, 5).map((crimeType, index) => (
                  <tr key={crimeType.id} className={index < 4 ? "border-b border-gray-300" : ""}>
                    <td className="px-4 py-2 text-white">{crimeType.name}</td>
                    <td className="px-4 py-2 text-white">{crimeType.count}</td>
                    <td className="px-4 py-2 text-white">{crimeType.status}</td>
                  </tr>
                ))}
                {/* Fallback rows if we have fewer than 5 crime types */}
                {Array.from({ length: Math.max(0, 5 - crimeTypes.length) }).map((_, index) => {
                  // Use a deterministic value based on the index instead of random
                  const count = (index + 1) * 3;
                  return (
                    <tr key={`fallback-${index}`} className={index + crimeTypes.length < 4 ? "border-b border-gray-300" : ""}>
                      <td className="px-4 py-2 text-white">Crime Type {index + crimeTypes.length + 1}</td>
                      <td className="px-4 py-2 text-white">{count}</td>
                      <td className="px-4 py-2 text-white">Active</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Police Investigation System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-200">
          Sign in to access the investigation dashboard
        </p>
        <p className="mt-2 text-center text-sm text-gray-200 max-w-md mx-auto">
          Our AI-powered system assists police officers in solving cases by providing intelligent analysis and insights
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Demo credentials</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800">
                <p><strong>Email:</strong> {demoCredentials.email}</p>
                <p><strong>Password:</strong> {demoCredentials.password}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
