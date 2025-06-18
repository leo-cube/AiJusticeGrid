import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better production deployment
  output: 'standalone',

  // Optimize for production
  poweredByHeader: false,

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL: process.env.NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL,
  },

  // API rewrites for development (optional - helps with CORS during development)
  async rewrites() {
    // Only apply rewrites in development mode
    if (process.env.NODE_ENV === 'development') {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const baseUrl = backendUrl.replace('/api', '');

      return [
        {
          source: '/api/:path*',
          destination: `${baseUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },

  // Headers for better security and CORS handling
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        ],
      },
    ];
  },
};

export default nextConfig;
