/* eslint-disable */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import { ChatMessage, InvestigationReport } from '@/app/types';

interface DownloadReportButtonProps {
  message: ChatMessage;
}

const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({ message }) => {
  const router = useRouter();

  // Check if this is a final analysis message
  const isFinalAnalysis = () => {
    // Check if this is from a murder agent and is an analysis
    if (
      (message.agentType === 'murder' ||
       message.agentType === 'murder-chief' ||
       message.agentType === 'murder-cop-2' ||
       message.agentType === 'murder-case-3' ||
       message.agentType === 'theft' ||
       message.agentType === 'finance') &&
      message.context?.currentStep === 'analysis'
    ) {
      return true;
    }

    // Check if the message content contains analysis markers
    const analysisMarkers = [
      'ANALYSIS:',
      'COMPREHENSIVE ANALYSIS',
      'FINAL ANALYSIS',
      'INVESTIGATION SUMMARY',
      'CASE ANALYSIS'
    ];

    return analysisMarkers.some(marker =>
      message.content.toUpperCase().includes(marker)
    );
  };

  // Handle click to create report and redirect
  const handleCreateReport = async () => {
    try {
      // Extract questions and answers from the conversation
      const questions: { question: string; answer: string }[] = [];

      // In a real implementation, you would extract the Q&A from the conversation history
      // For now, we'll create a simple placeholder
      questions.push({
        question: 'What was investigated?',
        answer: `A ${message.context?.caseType || 'crime'} case`
      });

      // Create the investigation report
      const reportData: Partial<InvestigationReport> = {
        title: message.context?.caseTitle || 'Investigation Report',
        investigationId: message.context?.caseId || `case-${Date.now()}`,
        investigationType: message.context?.caseType || 'general',
        questions: questions,
        analysis: message.content,
        createdBy: 'Current User'
      };

      // Submit the report to the API
      const response = await fetch('/api/investigation-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to create investigation report');
      }

      // Redirect to the reports page
      router.push('/reports');
    } catch (error) {
      console.error('Error creating investigation report:', error);
      alert('Failed to create investigation report. Please try again later.');
    }
  };

  // Only render the button if this is a final analysis message
  if (!isFinalAnalysis()) {
    return null;
  }

  return (
    <div className="mt-4 flex justify-end">
      <Button
        onClick={handleCreateReport}
        className="flex items-center"
        size="sm"
      >
        <ArrowDownIcon className="mr-1 h-4 w-4" />
        Download Report
      </Button>
    </div>
  );
};

export default DownloadReportButton;
