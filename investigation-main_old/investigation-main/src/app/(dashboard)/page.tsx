'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard page
    router.push('/dashboard');
  }, [router]);

  return null;
}
