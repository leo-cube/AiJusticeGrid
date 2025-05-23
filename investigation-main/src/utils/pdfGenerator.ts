/* eslint-disable */
import { jsPDF } from 'jspdf';
import { InvestigationReport, InvestigationQuestion } from '@/app/types';
// Import jspdf-autotable
import 'jspdf-autotable';
// Extend the jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

/**
 * Generate a PDF document from an investigation report
 * @param report The investigation report to convert to PDF
 * @returns The generated PDF document
 */
export const generateInvestigationReportPDF = (report: InvestigationReport): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Define colors and styles
  const primaryColor = '#003366';
  const secondaryColor = '#e0e0e0';
  const highlightBgColor = '#f0f7ff';

  // Set initial position
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  // Add badge image - using Windows compatible path
  try {
    // Use absolute path for Windows environment
    const badgeImagePath = 'C:\\Users\\e629\\Documents\\GitHub\\AiJusticeGrid\\investigation-main\\src\\assert\\updated_badge.webp';
    doc.addImage(badgeImagePath, 'WEBP', pageWidth - 40, 10, 20, 20);
  } catch (error) {
    console.warn('Could not add badge image:', error);
    // Continue without the image if it fails
  }

  // Create cover page
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Add title to cover page
  doc.setFontSize(28);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('MURDER AGENT REPORT', pageWidth / 2, 80, { align: 'center' });

  // Add horizontal line under title
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 60, 85, pageWidth / 2 + 60, 85);

  // Add case information
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Case ID: ${report.investigationId}`, pageWidth / 2, 110, { align: 'center' });
  doc.text(`Report Type: ${report.investigationType} – Initial Investigation`, pageWidth / 2, 125, { align: 'center' });

  // Add confidential box
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth / 2 - 60, 150, 120, 25);
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text('CONFIDENTIAL - HOMICIDE AGENT', pageWidth / 2, 165, { align: 'center' });

  // Add date
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Filed On: ${new Date(report.createdDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, pageWidth / 2, 190, { align: 'center' });

  // Add footer to cover page
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`City Police Department - Page 1 of ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Add new page for content
  doc.addPage();
  yPos = 20;

  // Add header with badge
  try {
    const badgeImagePath = 'C:\\Users\\e629\\Documents\\GitHub\\AiJusticeGrid\\investigation-main\\src\\assert\\updated_badge.webp';
    doc.addImage(badgeImagePath, 'WEBP', margin, yPos - 15, 10, 10);
  } catch (error) {
    console.warn('Could not add badge image in header:', error);
  }

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('🕵️‍♂️ MURDER AGENT REPORT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Add metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Issued By: Homicide Investigation Unit`, margin, yPos);
  yPos += 5;
  doc.text(`Report Type: ${report.investigationType} – Initial Investigation`, margin, yPos);
  yPos += 5;
  doc.text(`Filed On: ${new Date(report.createdDate).toLocaleDateString()}`, margin, yPos);
  yPos += 5;
  doc.text(`Case ID: ${report.investigationId}`, margin, yPos);
  yPos += 15;

  // Add section divider
  doc.setDrawColor(secondaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

  // Add questions and answers section
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('I. INCIDENT DETAILS', margin, yPos);
  yPos += 10;

  // Create a table for incident details if questions exist
  if (report.questions && report.questions.length > 0) {
    // Extract questions that might be incident details
    const incidentQuestions = report.questions.filter(q =>
      q.question.toLowerCase().includes('cause of death') ||
      q.question.toLowerCase().includes('weapon') ||
      q.question.toLowerCase().includes('victim') ||
      q.question.toLowerCase().includes('location') ||
      q.question.toLowerCase().includes('time') ||
      q.question.toLowerCase().includes('date')
    );

    if (incidentQuestions.length > 0) {
      // Use the doc.autoTable method
      doc.autoTable({
        startY: yPos,
        head: [['Field', 'Information']],
        body: incidentQuestions.map(q => [q.question, q.answer]),
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102], // #003366 in RGB
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 249, 249]
        },
        styles: {
          cellPadding: 5,
          fontSize: 10
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      // Update yPos after the table
      yPos = doc.lastAutoTable.finalY + 10;
    }
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('No incident details recorded for this investigation.', margin, yPos);
    yPos += 10;
  }

  // Add section divider
  doc.setDrawColor(secondaryColor);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  // Add crime scene description section
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('II. CRIME SCENE DESCRIPTION', margin, yPos);
  yPos += 10;

  // Find crime scene description question
  const crimeSceneQuestion = report.questions.find(q =>
    q.question.toLowerCase().includes('crime scene') ||
    q.question.toLowerCase().includes('scene description')
  );

  if (crimeSceneQuestion) {
    // Add highlight box for crime scene description
    doc.setFillColor(highlightBgColor);
    doc.setDrawColor(primaryColor);
    doc.roundedRect(margin, yPos, contentWidth, 30, 1, 1, 'F');
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + 4, yPos);

    // Add crime scene description text
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const crimeSceneLines = doc.splitTextToSize(crimeSceneQuestion.answer, contentWidth - 10);
    doc.text(crimeSceneLines, margin + 5, yPos + 10);

    // Update yPos based on text height
    yPos += Math.max(30, crimeSceneLines.length * 6 + 10);
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('No crime scene description recorded.', margin, yPos);
    yPos += 10;
  }

  // Add section divider
  doc.setDrawColor(secondaryColor);
  doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
  yPos += 15;

  // Check if we need a new page for the analysis
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  // Add analysis section
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('III. ANALYSIS & RECOMMENDATIONS', margin, yPos);
  yPos += 10;

  // Add analysis content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Clean up the analysis text to remove special characters
  const cleanAnalysis = report.analysis
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\n\n/g, '\n') // Normalize double line breaks
    .trim();

  const analysisLines = doc.splitTextToSize(cleanAnalysis, contentWidth);
  doc.text(analysisLines, margin, yPos);

  // Update yPos based on text height
  yPos += analysisLines.length * 5 + 10;

  // Add section divider
  doc.setDrawColor(secondaryColor);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Add filed by section
  doc.setFontSize(10);
  doc.text(`Filed By:`, margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text(report.createdBy, margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Homicide Agent – AIJUSTICEGRID`, margin, yPos);

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`City Police Department - Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc;
};

/**
 * Download a PDF document with a given filename
 * @param doc The PDF document to download
 * @param filename The filename for the downloaded PDF
 */
export const downloadPDF = (doc: jsPDF, filename: string): void => {
  doc.save(filename);
};
