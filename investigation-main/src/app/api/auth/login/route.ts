/* eslint-disable */
import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

/**
 * POST handler for authentication
 * Handles user login requests
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // In a real application, this would validate against a database
    // For now, we'll use hardcoded demo credentials
    if (body.email === 'admin@police.gov' && body.password === 'password') {
      // Import mock user data
      const { default: mockApi } = await import('@/mocks/api');
      const mockResponse = mockApi['/auth/login'];
      
      return NextResponse.json(mockResponse, { status: 200 });
    }
    
    // If credentials don't match, return unauthorized
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error processing login request:', error);
    return NextResponse.json(
      { error: 'Failed to process login request' },
      { status: 500 }
    );
  }
}
