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

  // Handle click to generate and download PDF using the working approach
  const handleDownloadPDF = async () => {
    if (!messages || messages.length === 0) {
      alert('No conversation data available to generate PDF');
      return;
    }

    setIsGenerating(true);

    try {
      // Use the same data structure as the working PDFGenerationButton
      const pdfData = {
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
        }
      };

      console.log('Generating PDF with data:', {
        title: pdfData.title,
        messageCount: pdfData.messages.length,
        agentType: pdfData.agentType
      });

      // Call the PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
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

      console.log('PDF generated and downloaded successfully');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className={`flex items-center ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
        size="sm"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <ArrowDownIcon className="mr-1 h-4 w-4" />
            Download PDF Report
          </>
        )}
      </Button>
    </div>
  );
};

export default DownloadReportButton;
