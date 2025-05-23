import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

export async function GET() {
  try {
    // Return the crime types from default settings
    // In a real application, this would fetch from a database
    const crimeTypes = defaultSettings.crimeTypes;
    
    return NextResponse.json(crimeTypes, { status: 200 });
  } catch (error) {
    console.error('Error fetching crime types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crime types' },
      { status: 500 }
    );
  }
}
