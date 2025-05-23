import { NextResponse } from 'next/server';

/**
 * GET handler for token validation
 * Validates the authentication token
 */
export async function GET(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // In a real application, this would validate the token against a database or JWT
    // For now, we'll accept any token that matches our mock token
    if (token === 'mock-token') {
      return NextResponse.json({ valid: true }, { status: 200 });
    }
    
    // If token doesn't match, return unauthorized
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}
