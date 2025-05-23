'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard/reports page
    router.push('/dashboard/reports');
  }, [router]);

  return null;
}
