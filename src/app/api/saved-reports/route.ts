import { NextRequest, NextResponse } from 'next/server';
import { SavedPDFReport } from '@/app/types';
import fs from 'fs';
import path from 'path';

// File-based storage for saved reports
const REPORTS_FILE_PATH = path.join(process.cwd(), 'data', 'saved-reports.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(REPORTS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load saved reports from file
const loadSavedReports = (): SavedPDFReport[] => {
  try {
    ensureDataDirectory();
    if (fs.existsSync(REPORTS_FILE_PATH)) {
      const data = fs.readFileSync(REPORTS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading saved reports:', error);
    return [];
  }
};

// Save reports to file
const saveSavedReports = (reports: SavedPDFReport[]): void => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(REPORTS_FILE_PATH, JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error('Error saving reports to file:', error);
    throw error;
  }
};

/**
 * GET handler for saved PDF reports
 * Returns all saved reports or a specific report by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Load reports from persistent storage
    const savedReports = loadSavedReports();

    // If ID is provided, return specific report
    if (id) {
      const report = savedReports.find(report => report.id === id);

      if (!report) {
        return NextResponse.json(
          { error: 'Saved report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(report, { status: 200 });
    }

    // Otherwise return all reports, sorted by creation date (newest first)
    const sortedReports = savedReports.sort((a, b) =>
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );

    return NextResponse.json(sortedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching saved reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved reports' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for saving a new PDF report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.agentType || !body.conversationData) {
      return NextResponse.json(
        { error: 'Missing required fields: title, agentType, conversationData' },
        { status: 400 }
      );
    }

    // Load existing reports from persistent storage
    const savedReports = loadSavedReports();

    // Generate unique ID and filename
    const reportId = `RPT-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const filename = `${body.agentType}_report_${reportId}.pdf`;

    // Create new saved report
    const newReport: SavedPDFReport = {
      id: reportId,
      title: body.title,
      agentType: body.agentType,
      caseId: body.caseId,
      filename: filename,
      createdDate: timestamp,
      conversationData: body.conversationData,
      fileSize: body.fileSize,
      status: 'generated',
      description: body.description || `PDF report generated from ${body.agentType} agent conversation`
    };

    // Add to saved reports and save to file
    savedReports.push(newReport);
    saveSavedReports(savedReports);

    console.log('Saved new PDF report:', {
      id: newReport.id,
      title: newReport.title,
      agentType: newReport.agentType,
      filename: newReport.filename
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Error saving PDF report:', error);
    return NextResponse.json(
      { error: 'Failed to save PDF report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a saved report
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Load existing reports from persistent storage
    const savedReports = loadSavedReports();

    // Find and remove the report
    const reportIndex = savedReports.findIndex(report => report.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Saved report not found' },
        { status: 404 }
      );
    }

    const deletedReport = savedReports.splice(reportIndex, 1)[0];

    // Save updated reports to file
    saveSavedReports(savedReports);

    console.log('Deleted PDF report:', {
      id: deletedReport.id,
      title: deletedReport.title
    });

    return NextResponse.json(
      { message: 'Report deleted successfully', deletedReport },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting saved report:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved report' },
      { status: 500 }
    );
  }
}
