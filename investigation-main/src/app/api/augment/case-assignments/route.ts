/* eslint-disable */
import { NextResponse } from 'next/server';

// Mock database for case assignments (in a real app, this would be a database)
let caseAssignments = [
  {
    id: 'assignment-1',
    caseId: 'murder-case-1',
    caseName: 'Riverside Homicide',
    roleId: 'inspector',
    roleName: 'Inspector',
    officerName: 'John Smith',
    assignedDate: '2023-05-15',
  },
  {
    id: 'assignment-2',
    caseId: 'murder-case-2',
    caseName: 'Downtown Murder',
    roleId: 'ips',
    roleName: 'IPS',
    officerName: 'Sarah Johnson',
    assignedDate: '2023-06-22',
  },
  {
    id: 'assignment-3',
    caseId: 'murder-case-3',
    caseName: 'Hotel Homicide',
    roleId: 'ds',
    roleName: 'DS',
    officerName: 'Michael Brown',
    assignedDate: '2023-07-10',
  },
];

/**
 * GET handler for case assignments
 * Returns all case assignments or filtered by case ID or role ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const roleId = searchParams.get('roleId');
    const id = searchParams.get('id');
    
    let filteredAssignments = [...caseAssignments];
    
    // Filter by ID if provided
    if (id) {
      const assignment = caseAssignments.find(a => a.id === id);
      
      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'Case assignment not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: assignment }, { status: 200 });
    }
    
    // Filter by case ID if provided
    if (caseId) {
      filteredAssignments = filteredAssignments.filter(
        assignment => assignment.caseId === caseId
      );
    }
    
    // Filter by role ID if provided
    if (roleId) {
      filteredAssignments = filteredAssignments.filter(
        assignment => assignment.roleId === roleId
      );
    }
    
    return NextResponse.json({ success: true, data: filteredAssignments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching case assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new case assignment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.caseId || !body.roleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new assignment
    const newAssignment = {
      id: `assignment-${Date.now()}`,
      caseId: body.caseId,
      caseName: body.caseName || `Case ${body.caseId}`,
      roleId: body.roleId,
      roleName: body.roleName || body.roleId,
      officerName: body.officerName || 'Unassigned',
      assignedDate: body.assignedDate || new Date().toISOString().split('T')[0],
    };
    
    // Add to assignments
    caseAssignments.push(newAssignment);
    
    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('Error creating case assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create case assignment' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a case assignment
 */
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing assignment ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Find assignment
    const assignmentIndex = caseAssignments.findIndex(a => a.id === id);
    
    if (assignmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Case assignment not found' },
        { status: 404 }
      );
    }
    
    // Update assignment
    caseAssignments[assignmentIndex] = {
      ...caseAssignments[assignmentIndex],
      ...body,
    };
    
    return NextResponse.json({ success: true, data: caseAssignments[assignmentIndex] }, { status: 200 });
  } catch (error) {
    console.error('Error updating case assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update case assignment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a case assignment
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing assignment ID' },
        { status: 400 }
      );
    }
    
    // Find assignment
    const assignmentIndex = caseAssignments.findIndex(a => a.id === id);
    
    if (assignmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Case assignment not found' },
        { status: 404 }
      );
    }
    
    // Remove assignment
    const removedAssignment = caseAssignments[assignmentIndex];
    caseAssignments = caseAssignments.filter(a => a.id !== id);
    
    return NextResponse.json({ success: true, data: removedAssignment }, { status: 200 });
  } catch (error) {
    console.error('Error deleting case assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete case assignment' },
      { status: 500 }
    );
  }
}
