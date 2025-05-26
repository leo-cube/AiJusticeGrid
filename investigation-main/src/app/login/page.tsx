'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Login redirect page
 * This page redirects users from /login to /auth/login
 * to maintain backward compatibility with existing links
 */
export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual login page
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
