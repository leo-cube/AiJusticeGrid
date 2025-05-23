'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssignmentsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard/assignments page
    router.push('/dashboard/assignments');
  }, [router]);

  return null;
}
