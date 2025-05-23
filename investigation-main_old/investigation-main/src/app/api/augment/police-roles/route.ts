/* eslint-disable */
import { NextResponse } from 'next/server';

// Mock database for police roles (in a real app, this would be a database)
const policeRoles = [
  {
    id: 'inspector',
    name: 'Inspector',
    description: 'Senior investigating officer responsible for case oversight',
    level: 'senior',
  },
  {
    id: 'ips',
    name: 'IPS',
    description: 'Indian Police Service officer',
    level: 'senior',
  },
  {
    id: 'ds',
    name: 'DS',
    description: 'Detective Sergeant',
    level: 'mid',
  },
  {
    id: 'officer',
    name: 'Police Officer',
    description: 'Regular police officer',
    level: 'junior',
  },
];

/**
 * GET handler for police roles
 * Returns all police roles or a specific role by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // If ID is provided, return specific role
    if (id) {
      const role = policeRoles.find(role => role.id === id);
      
      if (!role) {
        return NextResponse.json(
          { success: false, error: 'Police role not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: role }, { status: 200 });
    }
    
    // Otherwise return all roles
    return NextResponse.json({ success: true, data: policeRoles }, { status: 200 });
  } catch (error) {
    console.error('Error fetching police roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch police roles' },
      { status: 500 }
    );
  }
}
