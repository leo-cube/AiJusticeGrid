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

  // Handle click to generate and download PDF
  const handleDownloadPDF = async () => {
    try {
      // Create incident data from the message context and content
      const incidentData = {
        id: message.context?.caseId || `case-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        location: message.context?.location || 'Unknown',
        incident_type: message.context?.caseType || message.agentType || 'Investigation',
        description: 'AI-generated investigation analysis',
        reporting_officer: 'AI Agent',
        evidence: 'Digital analysis and investigation',
        status: 'Completed',
        victims: message.context?.victims || [],
        suspects: message.context?.suspects || [],
        ai_analysis: message.content.replace(/\*\*/g, '').replace(/\[LIVE DATA ANALYSIS\]/g, '').trim()
      };

      // Call the PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
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
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again later.');
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
        className="flex items-center"
        size="sm"
      >
        <ArrowDownIcon className="mr-1 h-4 w-4" />
        Download PDF Report
      </Button>
    </div>
  );
};

export default DownloadReportButton;
