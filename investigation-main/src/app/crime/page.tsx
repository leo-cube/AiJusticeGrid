'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CrimePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard/crime page
    router.push('/dashboard/crime');
  }, [router]);

  return null;
}
