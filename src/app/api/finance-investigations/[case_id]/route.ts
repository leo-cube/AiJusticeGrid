import { NextResponse } from 'next/server';

// Finance investigations API URL
const FINANCE_INVESTIGATIONS_API_URL = process.env.NEXT_PUBLIC_FINANCE_INVESTIGATIONS_API_URL || 'http://localhost:5000/api/finance-investigations';

/**
 * Get a specific finance investigation by case ID
 * This endpoint retrieves a single finance investigation case
 */
export async function GET(
  request: Request,
  { params }: { params: { case_id: string } }
) {
  try {
    const caseId = params.case_id;
    
    if (!caseId) {
      return NextResponse.json({
        error: 'Missing case ID parameter'
      }, { status: 400 });
    }
    
    console.log('Fetching finance investigation for case ID:', caseId);
    
    // Create a timeout to prevent hanging if the backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Call the backend API to get the specific finance investigation
      const response = await fetch(`${FINANCE_INVESTIGATIONS_API_URL}/${caseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully retrieved finance investigation for case:', caseId);
        
        return NextResponse.json(data);
      } else if (response.status === 404) {
        console.log('Finance investigation not found for case:', caseId);
        
        return NextResponse.json({
          error: `Finance investigation not found for case ID: ${caseId}`,
          case_id: caseId,
          found: false
        }, { status: 404 });
      } else {
        console.error('Finance investigations API returned error status:', response.status, response.statusText);
        
        return NextResponse.json({
          error: `Finance investigations API returned status ${response.status}: ${response.statusText}`,
          case_id: caseId,
          found: false
        }, { status: response.status });
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Finance investigation API request timed out for case:', caseId);
        return NextResponse.json({
          error: 'Finance investigation API request timed out',
          case_id: caseId,
          found: false
        }, { status: 408 });
      }
      
      console.error('Finance investigations API is not available:', fetchError.message);
      return NextResponse.json({
        error: `Finance investigations API is not available: ${fetchError.message}`,
        case_id: caseId,
        found: false
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Error fetching finance investigation:', error);
    return NextResponse.json({
      error: 'Failed to fetch finance investigation',
      case_id: params.case_id,
      found: false
    }, { status: 500 });
  }
}
