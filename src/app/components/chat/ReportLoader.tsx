'use client';

import React from 'react';

type ReportLoaderProps = {
  message?: string;
};

const ReportLoader: React.FC<ReportLoaderProps> = ({ 
  message = 'Generating report...' 
}) => {
  return (
    <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-100 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1">
          <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-sm font-medium text-blue-800">{message}</span>
      </div>
      <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5">
        <div className="bg-blue-500 h-1.5 rounded-full w-3/4 animate-pulse"></div>
      </div>
    </div>
  );
};

export default ReportLoader;
