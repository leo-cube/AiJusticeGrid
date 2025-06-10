import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    pythonBackendUrl: process.env.PYTHON_BACKEND_URL || 'NOT_SET',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV
  });
}
