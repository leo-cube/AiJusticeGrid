import { NextResponse } from 'next/server';

// Finance investigations API URL
const FINANCE_INVESTIGATIONS_API_URL = process.env.NEXT_PUBLIC_FINANCE_INVESTIGATIONS_API_URL || 'http://localhost:5000/api/finance-investigations';

/**
 * Get all finance investigations
 * This endpoint retrieves all stored finance investigation cases
 */
export async function GET() {
  try {
    console.log('Fetching all finance investigations from:', FINANCE_INVESTIGATIONS_API_URL);
    
    // Create a timeout to prevent hanging if the backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Call the backend API to get all finance investigations
      const response = await fetch(FINANCE_INVESTIGATIONS_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully retrieved finance investigations');
        
        return NextResponse.json(data);
      } else {
        console.error('Finance investigations API returned error status:', response.status, response.statusText);
        
        return NextResponse.json({
          error: `Finance investigations API returned status ${response.status}: ${response.statusText}`,
          investigations: {},
          metadata: {
            total_cases: 0,
            error: 'Backend unavailable'
          }
        }, { status: response.status });
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Finance investigations API request timed out');
        return NextResponse.json({
          error: 'Finance investigations API request timed out',
          investigations: {},
          metadata: {
            total_cases: 0,
            error: 'Request timeout'
          }
        }, { status: 408 });
      }
      
      console.error('Finance investigations API is not available:', fetchError.message);
      return NextResponse.json({
        error: `Finance investigations API is not available: ${fetchError.message}`,
        investigations: {},
        metadata: {
          total_cases: 0,
          error: 'Backend unavailable'
        }
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Error fetching finance investigations:', error);
    return NextResponse.json({
      error: 'Failed to fetch finance investigations',
      investigations: {},
      metadata: {
        total_cases: 0,
        error: 'Internal server error'
      }
    }, { status: 500 });
  }
}
