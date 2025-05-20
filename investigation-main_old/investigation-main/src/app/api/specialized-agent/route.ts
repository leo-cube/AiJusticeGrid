/* eslint-disable */
import { NextResponse } from 'next/server';
import { AgentType, ChatContext } from '@/app/types';
import { getSpecializedAgent } from '@/services/augmentAI';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crimeType = searchParams.get('crimeType');
    const caseId = searchParams.get('caseId');
    
    // Validate required fields
    if (!crimeType) {
      return NextResponse.json(
        { error: 'Missing required field: crimeType' },
        { status: 400 }
      );
    }
    
    // Get the specialized agent for this crime type
    const { agentType, context } = await getSpecializedAgent(crimeType, caseId || undefined);
    
    return NextResponse.json({ agentType, context }, { status: 200 });
  } catch (error) {
    console.error('Error getting specialized agent:', error);
    return NextResponse.json(
      { error: 'Failed to get specialized agent' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.crimeType) {
      return NextResponse.json(
        { error: 'Missing required field: crimeType' },
        { status: 400 }
      );
    }
    
    // Get the specialized agent for this crime type
    const { agentType, context } = await getSpecializedAgent(
      body.crimeType,
      body.caseId || undefined
    );
    
    // Override context with provided values if available
    if (body.caseTitle) context.caseTitle = body.caseTitle;
    if (body.caseStatus) context.caseStatus = body.caseStatus;
    if (body.casePriority) context.casePriority = body.casePriority;
    if (body.assignedTo) context.assignedTo = body.assignedTo;
    if (body.assignedDate) context.assignedDate = body.assignedDate;
    
    return NextResponse.json({ agentType, context }, { status: 200 });
  } catch (error) {
    console.error('Error getting specialized agent:', error);
    return NextResponse.json(
      { error: 'Failed to get specialized agent' },
      { status: 500 }
    );
  }
}
