'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard redirect page
 * This page redirects users from /dashboard to /dashboard/dashboard
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard page
    router.replace('/dashboard/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
