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
  ArrowRightIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function AIAgentsPage() {
  const router = useRouter();

  // Redirect to DegreeGuru chat page on component mount
  useEffect(() => {
    // Optional: Add a small delay to show the page before redirecting
    const redirectTimer = setTimeout(() => {
      router.push('/degree-guru');
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  // Group agents by type
  const agentsByType = {
    main: defaultAgents.filter(agent => !agent.parentType),
    murder: defaultAgents.filter(agent => agent.parentType === 'murder'),
    finance: defaultAgents.filter(agent => agent.parentType === 'finance'),
    theft: defaultAgents.filter(agent => agent.parentType === 'theft'),
  };

  // Handle agent selection
  const handleAgentSelect = (agentType: AgentType) => {
    router.push(`/degree-guru?agent=${agentType}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-500">
            Our agent system has been upgraded to the DegreeGuru interface
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main content area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AcademicCapIcon className="h-6 w-6 mr-2 text-green-600" />
              Agent Interface
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
                {agentsByType.main.map((agent) => (
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
