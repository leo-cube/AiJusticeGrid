/* eslint-disable */
import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

// Mock database for assignments (in a real app, this would be a database)
let assignments = Object.entries(defaultSettings.agentAssignments).map(([crimeTypeId, agentTypeId]) => {
  // Find the crime type name
  const crimeType = defaultSettings.crimeTypes.find(ct => ct.id === crimeTypeId);
  
  return {
    id: `assignment-${crimeTypeId}`,
    crimeTypeId,
    crimeTypeName: crimeType?.name || crimeTypeId,
    agentTypeId,
  };
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crimeType = searchParams.get('crimeType');
    const agentType = searchParams.get('agentType');
    
    let filteredAssignments = [...assignments];
    
    // Filter by crime type if provided
    if (crimeType) {
      filteredAssignments = filteredAssignments.filter(
        assignment => assignment.crimeTypeId === crimeType
      );
    }
    
    // Filter by agent type if provided
    if (agentType) {
      filteredAssignments = filteredAssignments.filter(
        assignment => assignment.agentTypeId === agentType
      );
    }
    
    return NextResponse.json(filteredAssignments, { status: 200 });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.crimeTypeId || !body.agentTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new assignment
    const newAssignment = {
      id: `assignment-${body.crimeTypeId}-${Date.now()}`,
      crimeTypeId: body.crimeTypeId,
      crimeTypeName: body.crimeTypeName || body.crimeTypeId,
      agentTypeId: body.agentTypeId,
    };
    
    // Add to assignments
    assignments.push(newAssignment);
    
    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing assignment ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Find assignment
    const assignmentIndex = assignments.findIndex(a => a.id === id);
    
    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    // Update assignment
    assignments[assignmentIndex] = {
      ...assignments[assignmentIndex],
      ...body,
    };
    
    return NextResponse.json(assignments[assignmentIndex], { status: 200 });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}
