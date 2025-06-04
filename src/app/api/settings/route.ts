import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

// In a real application, this would be stored in a database
let settings = { ...defaultSettings };

export async function GET() {
  try {
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Update settings
    settings = {
      ...settings,
      ...body,
    };
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
