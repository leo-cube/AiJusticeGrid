'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import UnifiedAgentChat from '@/app/components/chat/UnifiedAgentChat';
import { useChat } from '@/app/context/ChatContext';
import { AgentType } from '@/app/types';

function DegreeGuruContent() {
  const searchParams = useSearchParams();
  const agentType = searchParams.get('agent') as AgentType || 'degree-guru';
  const { setCurrentAgent, currentAgent } = useChat();

  // Set the current agent based on the URL parameter
  useEffect(() => {
    // Only update if the agent type is different
    if (agentType && currentAgent !== agentType) {
      console.log(`DegreeGuruPage: Setting current agent to ${agentType}`);
      const context = {
        usingLiveBackend: true
      };
      setCurrentAgent(agentType, context);
    }
    // We intentionally don't include currentContext in the dependency array
    // to avoid circular updates
  }, [agentType, currentAgent, setCurrentAgent]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <UnifiedAgentChat
          className="h-[calc(100vh-8rem)] shadow-xl"
          agentType={agentType}
        />
      </div>
    </div>
  );
}

export default function DegreeGuruPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DegreeGuruContent />
    </Suspense>
  );
}
