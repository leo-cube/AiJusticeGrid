'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useChat } from '@/app/context/ChatContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // We still use the chat context for agent interactions
  const { setCurrentAgent } = useChat();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
      {/* Chat sidebar removed */}
    </div>
  );
};

export default DashboardLayout;
