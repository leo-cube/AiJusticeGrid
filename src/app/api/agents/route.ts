import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

export async function GET() {
  try {
    // Return the agent types from default settings
    // In a real application, this would fetch from a database
    const agents = defaultSettings.agentTypes;
    
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
