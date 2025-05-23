/* eslint-disable */
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { defaultAgents } from '@/app/components/chat/AgentSelector';
import { AgentType } from '@/app/types';
import {
  ChatBubbleLeftRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

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

  // Filter agents to only show main agents
  const mainAgents = defaultAgents.filter(agent => !agent.parentType);

  // Handle agent selection
  const handleAgentSelect = (agentType: AgentType) => {
    router.push(`/degree-guru?agent=${agentType}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Assistant</h1>
          <p className="text-gray-500">
            Our chat system has been upgraded to the DegreeGuru interface
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main content area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-green-600" />
              Agent Chat Interface
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <p className="text-gray-600 mb-6">
                Our new Agent chatbot now handles all your agent interactions in one unified interface.
                You are being redirected to the new chat interface.
              </p>

              <Button
                onClick={() => router.push('/degree-guru')}
                className="mx-auto mb-8"
              >
                Go to Agent Chat <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {mainAgents.map((agent) => (
                  <Button
                    key={agent.id}
                    variant="outline"
                    onClick={() => handleAgentSelect(agent.id as AgentType)}
                    className="flex items-center justify-center p-4"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${agent.avatarColor} mr-2`}>
                      <span className="text-white font-bold">{agent.name.charAt(0)}</span>
                    </div>
                    <span>Talk to {agent.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
