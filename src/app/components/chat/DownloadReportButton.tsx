/* eslint-disable */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import { ChatMessage, InvestigationReport } from '@/app/types';
import { useChat } from '@/app/context/ChatContext';

interface DownloadReportButtonProps {
  message: ChatMessage;
}

const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({ message }) => {
  const router = useRouter();
  const { messages } = useChat();
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Handle click to generate and save PDF report
  const handleGenerateAndSaveReport = async () => {
    if (!messages || messages.length === 0) {
      alert('No conversation data available to generate PDF');
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare the conversation data for PDF generation
      const conversationData = {
        title: `${message.agentType?.charAt(0).toUpperCase() + message.agentType?.slice(1)} Investigation Report`,
        analysisType: message.agentType || 'general',
        agentType: message.agentType || 'general',
        messages: messages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          agentType: msg.agentType
        })),
        includeAIAnalysis: true,
        userMetadata: {
          sessionId: `session_${Date.now()}`,
          userId: 'user',
          requestId: Date.now().toString()
        },
        timestamp: new Date().toISOString()
      };

      console.log('Generating and saving PDF report...');

      // Call the PDF generation API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aijusticegrid.onrender.com'}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link for immediate download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'investigation_report.pdf';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('PDF generated, saved, and downloaded successfully');

      // Show success message with better UX
      const userConfirm = confirm(
        'PDF report generated and downloaded successfully!\n\n' +
        'The report has been saved and is available in the Reports page for future downloads.\n\n' +
        'Would you like to go to the Reports page now to see all your saved reports?'
      );

      // Only redirect if user confirms
      if (userConfirm) {
        router.push('/reports');
      }

    } catch (error) {
      console.error('Error generating PDF:', error);

      // More detailed error handling
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Show user-friendly error message
      alert(`Failed to generate PDF report: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Only render the button if this is a final analysis message
  if (!isFinalAnalysis()) {
    return null;
  }

  return (
    <div className="mt-4 flex justify-end">
      <Button
        onClick={handleGenerateAndSaveReport}
        disabled={isGenerating}
        className="flex items-center"
        size="sm"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            Saving Report...
          </>
        ) : (
          <>
            <ArrowDownIcon className="mr-1 h-4 w-4" />
            Download & Save Report
          </>
        )}
      </Button>
    </div>
  );
};

export default DownloadReportButton;
