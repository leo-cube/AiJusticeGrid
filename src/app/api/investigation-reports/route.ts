/* eslint-disable */
import { NextResponse } from 'next/server';
import { InvestigationReport } from '@/app/types';

// Mock investigation reports data
const mockInvestigationReports: InvestigationReport[] = [
  {
    id: 'INV-1001',
    title: 'Riverside Homicide Investigation',
    investigationId: 'murder-case-1',
    investigationType: 'murder',
    createdDate: '2025-05-15',
    createdBy: 'Detective Johnson',
    questions: [
      {
        question: 'What was the cause of death?',
        answer: 'Blunt force trauma to the head'
      },
      {
        question: 'When did the murder occur?',
        answer: 'Between 11 PM and 2 AM on May 14th'
      },
      {
        question: 'Were there any witnesses?',
        answer: 'One neighbor reported hearing a loud argument around midnight'
      }
    ],
    analysis: 'Based on the evidence collected, this appears to be a premeditated murder. The victim knew their attacker, as evidenced by the lack of forced entry. The murder weapon was likely a heavy object found at the scene, possibly the brass statue found with partial fingerprints. Further forensic analysis is required to confirm the identity of the perpetrator.',
    status: 'completed'
  },
  {
    id: 'INV-1002',
    title: 'Downtown Bank Theft Investigation',
    investigationId: 'theft-case-1',
    investigationType: 'theft',
    createdDate: '2025-05-12',
    createdBy: 'Officer Smith',
    questions: [
      {
        question: 'What was stolen?',
        answer: 'Approximately $50,000 in cash'
      },
      {
        question: 'How did the perpetrators enter the bank?',
        answer: 'Through the rear service entrance'
      },
      {
        question: 'Were there any security cameras?',
        answer: 'Yes, footage shows three masked individuals'
      }
    ],
    analysis: 'This appears to be a well-planned robbery executed by professionals. The perpetrators knew the bank layout and security protocols, suggesting inside information. The timing coincided with a shift change, which reduced the number of staff present. Fingerprints recovered from the counter match those of a known offender with ties to organized crime.',
    status: 'completed'
  }
];

/**
 * GET handler for investigation reports
 * Returns all investigation reports or a specific report by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const investigationId = searchParams.get('investigationId');

    // If ID is provided, return specific report
    if (id) {
      const report = mockInvestigationReports.find(report => report.id === id);

      if (!report) {
        return NextResponse.json(
          { error: 'Investigation Report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(report, { status: 200 });
    }

    // If investigationId is provided, return reports for that investigation
    if (investigationId) {
      const reports = mockInvestigationReports.filter(report => report.investigationId === investigationId);

      return NextResponse.json(reports, { status: 200 });
    }

    // Otherwise return all reports
    return NextResponse.json(mockInvestigationReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching investigation reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investigation reports' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new investigation report
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.investigationId || !body.investigationType || !body.analysis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new investigation report
    const newReport: InvestigationReport = {
      id: `INV-${Date.now()}`,
      title: body.title,
      investigationId: body.investigationId,
      investigationType: body.investigationType,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: body.createdBy || 'System',
      questions: body.questions || [],
      analysis: body.analysis,
      status: 'completed'
    };

    // In a real application, this would save to a database
    mockInvestigationReports.push(newReport);

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Error creating investigation report:', error);
    return NextResponse.json(
      { error: 'Failed to create investigation report' },
      { status: 500 }
    );
  }
}
