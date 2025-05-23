'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard/settings page
    router.push('/dashboard/settings');
  }, [router]);

  return null;
}
