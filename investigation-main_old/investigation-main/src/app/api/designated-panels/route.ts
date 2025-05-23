/* eslint-disable */
import { NextResponse } from 'next/server';
import { DesignatedPanel } from '@/app/types';

/**
 * GET handler for designated panels
 * Returns all panels for a specific report
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (!reportId) {
      return NextResponse.json(
        { error: 'Missing required parameter: reportId' },
        { status: 400 }
      );
    }
    
    // In a real application, this would fetch panels from a database
    // For now, we'll import the mock data from the api-reports route
    const apiReportsModule = await import('../api-reports/route');
    const mockApiReports = (apiReportsModule as any).mockApiReports;
    
    const report = mockApiReports.find((report: any) => report.id === reportId);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(report.panels, { status: 200 });
  } catch (error) {
    console.error('Error fetching designated panels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designated panels' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new designated panel
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.reportId || !body.title || !body.type || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // In a real application, this would create a new panel in the database
    // For now, we'll just return a mock response
    const newPanel: DesignatedPanel = {
      id: `PANEL-${Date.now()}`,
      title: body.title,
      type: body.type,
      content: body.content,
      priority: body.priority || 'medium',
      assignedTo: body.assignedTo,
      metadata: body.metadata,
    };
    
    return NextResponse.json(newPanel, { status: 201 });
  } catch (error) {
    console.error('Error creating designated panel:', error);
    return NextResponse.json(
      { error: 'Failed to create designated panel' },
      { status: 500 }
    );
  }
}
