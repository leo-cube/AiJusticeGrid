/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import CrimeCard from '@/app/components/crime/CrimeCard';
import { apiService } from '@/services/api';
import defaultSettings from '@/config/defaultSettings.json';

export default function CrimePage() {
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCrimeTypes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get endpoint from config
        const endpoint = defaultSettings.api.endpoints.crimeTypes;
        
        // Fetch crime types from API
        const data = await apiService.get(endpoint);
        
        if (data) {
          setCrimeTypes(data);
        }
      } catch (error) {
        console.error('Error fetching crime types:', error);
        setError('Failed to load crime types. Please try again later.');
        
        // Fall back to default settings if API fails
        setCrimeTypes(defaultSettings.crimeTypes || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrimeTypes();
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-6 h-48"></div>
        ))}
      </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Crime Types</h1>
        <p className="text-gray-500">Select a crime type to investigate</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {crimeTypes.map((crimeType) => (
          <CrimeCard key={crimeType.id} crimeType={crimeType} />
        ))}
      </div>
    </div>
  );
}
