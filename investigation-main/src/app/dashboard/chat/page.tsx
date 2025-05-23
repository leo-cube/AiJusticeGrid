/* eslint-disable */
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function ChatPage() {
  const router = useRouter();

  // Redirect to DegreeGuru chat page on component mount
  useEffect(() => {
    // Optional: Add a small delay to show the page before redirecting
    const redirectTimer = setTimeout(() => {
      router.push('/degree-guru');
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat Interface</h1>
        <p className="text-gray-500">Interact with our AI assistants</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chat Interface</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <p className="text-gray-600 mb-6">
                Our new unified chat interface is now available. You are being redirected to the new chat interface.
              </p>

              <Button
                onClick={() => router.push('/degree-guru')}
                className="mx-auto mb-8"
              >
                Go to Chat Interface <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
