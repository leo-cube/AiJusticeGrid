'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-blue-600 flex items-center justify-center`}>
        <span className="text-white font-bold">PI</span>
      </div>
      <span className="ml-2 text-lg font-semibold">Police Investigation</span>
    </div>
  );
};

export default Logo;
