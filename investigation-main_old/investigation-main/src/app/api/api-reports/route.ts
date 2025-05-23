/* eslint-disable */
import { NextResponse } from 'next/server';
import { ApiReport, DesignatedPanel } from '@/app/types';

// Import mock data
import mockApi from '@/mocks/api';

// Mock API reports data - this will be replaced by the imported mock data
// but we keep it here for reference and type checking
const mockApiReports: ApiReport[] = [
  {
    id: 'API-1001',
    title: 'Theft Case Analysis',
    caseId: 'CR-1001',
    caseType: 'theft',
    generatedDate: '2025-05-10',
    generatedBy: 'Agent Theft',
    status: 'completed',
    panels: [
      {
        id: 'PANEL-1001-1',
        title: 'Case Summary',
        type: 'summary',
        content: 'Armed robbery at First National Bank. Suspects entered through the rear entrance at 10:15 AM and left with approximately $50,000 in cash.',
        priority: 'high',
      },
      {
        id: 'PANEL-1001-2',
        title: 'Evidence Analysis',
        type: 'evidence',
        content: 'Security footage shows three masked individuals. Fingerprints recovered from the counter match those of a known offender. Weapon appears to be a 9mm handgun based on recovered shell casings.',
        priority: 'medium',
      },
      {
        id: 'PANEL-1001-3',
        title: 'Recommendations',
        type: 'recommendations',
        content: 'Interview bank staff who were present during the robbery. Cross-reference the timing with nearby traffic cameras. Check for similar MO in recent robberies.',
        priority: 'high',
        assignedTo: 'John Doe',
      }
    ]
  },
  {
    id: 'API-1002',
    title: 'Financial Fraud Investigation',
    caseId: 'CR-1002',
    caseType: 'financial-fraud',
    generatedDate: '2025-05-12',
    generatedBy: 'Agent Finance',
    status: 'completed',
    panels: [
      {
        id: 'PANEL-1002-1',
        title: 'Fraud Pattern Analysis',
        type: 'analysis',
        content: 'Multiple fraudulent credit card transactions detected across 15 different merchants. All transactions occurred within a 48-hour window. Total fraud amount: $12,345.',
        priority: 'high',
      },
      {
        id: 'PANEL-1002-2',
        title: 'Timeline of Events',
        type: 'timeline',
        content: 'May 1: First fraudulent transaction\nMay 2: Peak of fraudulent activity\nMay 3: Last known transaction\nMay 4: Fraud detection system alert',
        priority: 'medium',
      }
    ]
  },
  {
    id: 'API-1003',
    title: 'Murder Investigation Report',
    caseId: 'murder-case-1',
    caseType: 'murder',
    generatedDate: '2025-05-15',
    generatedBy: 'Murder Chief',
    status: 'pending',
    panels: [
      {
        id: 'PANEL-1003-1',
        title: 'Forensic Analysis',
        type: 'analysis',
        content: 'Preliminary forensic analysis indicates the victim died from blunt force trauma to the head. Time of death estimated between 11 PM and 2 AM.',
        priority: 'high',
        assignedTo: 'Forensic Team',
      }
    ]
  }
];

/**
 * GET handler for API reports
 * Returns all API reports or a specific report by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const caseId = searchParams.get('caseId');

    // If ID is provided, return specific report
    if (id) {
      const report = mockApiReports.find(report => report.id === id);

      if (!report) {
        return NextResponse.json(
          { error: 'API Report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(report, { status: 200 });
    }

    // If caseId is provided, return reports for that case
    if (caseId) {
      const reports = mockApiReports.filter(report => report.caseId === caseId);

      return NextResponse.json(reports, { status: 200 });
    }

    // Otherwise return all reports
    // Use the mock data from the imported mock API
    return NextResponse.json(mockApi['/api-reports'], { status: 200 });
  } catch (error) {
    console.error('Error fetching API reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API reports' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new API report
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.caseId || !body.caseType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real application, this would create a new report in the database
    // For now, we'll just return a mock response
    const newReport: ApiReport = {
      id: `API-${Date.now()}`,
      title: body.title,
      caseId: body.caseId,
      caseType: body.caseType,
      generatedDate: new Date().toISOString().split('T')[0],
      generatedBy: body.generatedBy || 'System',
      status: 'pending',
      panels: body.panels || [],
    };

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Error creating API report:', error);
    return NextResponse.json(
      { error: 'Failed to create API report' },
      { status: 500 }
    );
  }
}
