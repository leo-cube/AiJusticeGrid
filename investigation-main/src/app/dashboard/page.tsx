'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard/dashboard page
    router.push('/dashboard/dashboard');
  }, [router]);

  return null;
}
