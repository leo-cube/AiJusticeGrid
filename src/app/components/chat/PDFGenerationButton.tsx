'use client';

import React, { useState } from 'react';
import { ChatMessage, AgentType } from '@/app/types';

interface PDFGenerationButtonProps {
  messages: ChatMessage[];
  currentAgent: AgentType;
  sessionId?: string;
  className?: string;
}

const PDFGenerationButton: React.FC<PDFGenerationButtonProps> = ({
  messages,
  currentAgent,
  sessionId,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    if (messages.length === 0) {
      setError('No conversation data to generate PDF');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Prepare data for PDF generation
      const pdfData = {
        title: `${currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1)} Investigation Report`,
        analysisType: currentAgent,
        agentType: currentAgent,
        messages: messages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          agentType: msg.agentType
        })),
        includeAIAnalysis: true,
        userMetadata: {
          sessionId: sessionId || 'unknown',
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

      // Show success message to user
      alert('PDF report generated and downloaded successfully!\n\nThe report has been saved and is available in the Reports page for future downloads.');

    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={generatePDF}
        disabled={isGenerating || messages.length === 0}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${isGenerating || messages.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
          }
        `}
        title={messages.length === 0 ? 'No conversation data available' : 'Generate PDF report with AI analysis'}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Generate PDF Report</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {messages.length > 0 && !isGenerating && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          <div>Investigation Report Format</div>
          <div>Case Details + AI Analysis Only</div>
        </div>
      )}
    </div>
  );
};

export default PDFGenerationButton;
