import { NextResponse } from 'next/server';
import { generateAgentResponse } from '@/app/utils/agentUtils';
import { AgentType, ChatContext } from '@/app/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.question || !body.agentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real application, this would call an external AI API
    // For now, we'll use our local agent response generator
    const response = generateAgentResponse(
      body.question,
      body.agentType as AgentType,
      body.context as ChatContext
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error('Error processing AI request:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
