import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Get Augment AI API key from environment variables
const AUGMENT_AI_API_KEY = process.env.NEXT_PUBLIC_AUGMENT_AI_API_KEY || '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';

/**
 * Initializes the Murder Agent backend
 * This function attempts to start the Murder Agent Python backend if it's not already running
 */
async function initializeMurderAgent(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the Agent folder exists
    const agentPath = path.join(process.cwd(), 'Agent');
    if (!fs.existsSync(agentPath)) {
      console.error('Agent folder not found');
      return { success: false, message: 'Agent folder not found' };
    }

    // Try to connect to the Murder Agent API to see if it's already running
    try {
      console.log('Checking if Murder Agent API is already running...');
      const response = await fetch('http://localhost:5000/api/augment/murder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'ping',
          additional_notes: 'This is a ping to check if the Murder Agent API is running.'
        }),
        // Short timeout to quickly check if the server is running
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        console.log('Murder Agent API is already running');
        return { success: true, message: 'Murder Agent API is already running' };
      } else {
        console.log('Murder Agent API responded but with an error, will attempt to restart it');
      }
    } catch (error) {
      console.log('Murder Agent API is not running, will attempt to start it:', error);
    }

    // Try different Python commands based on the OS
    const pythonCommands = process.platform === 'win32'
      ? ['py', 'python3', 'python']
      : ['python3', 'python'];

    // Try to find a working Python command
    let pythonProcess;
    let spawnErrors = '';

    // Use the first Python command that works
    for (const cmd of pythonCommands) {
      try {
        console.log(`Attempting to start Murder Agent with ${cmd}`);

        // Start the Murder Agent as an API server
        pythonProcess = spawn(cmd, [
          path.join(agentPath, 'murder_agent_main.py'),
          '--api',
          '--api_key', AUGMENT_AI_API_KEY
        ], {
          detached: true, // Run in the background
          stdio: 'ignore' // Ignore stdio to fully detach
        });

        // Unref the process to allow the Node.js process to exit independently
        pythonProcess.unref();

        // If we get here without an error, break the loop
        console.log(`Started Murder Agent API server with ${cmd}`);
        break;
      } catch (error) {
        spawnErrors += `Failed to spawn Python process with ${cmd}: ${error}\n`;
        // Continue to the next command
      }
    }

    // If no Python command worked, return an error
    if (!pythonProcess) {
      console.error(`Failed to start Murder Agent API server: ${spawnErrors}`);
      return {
        success: false,
        message: `Failed to start Murder Agent API server: ${spawnErrors}`
      };
    }

    // Wait a moment for the server to start
    console.log('Waiting for Murder Agent API server to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try to verify the server is running
    try {
      console.log('Verifying Murder Agent API server...');
      const verifyResponse = await fetch('http://localhost:5000/api/augment/murder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'ping',
          additional_notes: 'This is a ping to verify the Murder Agent API is running.'
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (verifyResponse.ok) {
        console.log('Murder Agent API server started successfully');
        return { success: true, message: 'Murder Agent API server started successfully' };
      } else {
        console.error('Murder Agent API server failed to respond properly:', await verifyResponse.text());
        return {
          success: false,
          message: 'Murder Agent API server failed to respond properly'
        };
      }
    } catch (error) {
      console.error('Error verifying Murder Agent API server:', error);

      // Even if verification fails, the server might still be starting up
      // Return success but with a warning
      return {
        success: true,
        message: `Murder Agent API server started, but verification timed out. It may still be initializing.`
      };
    }
  } catch (error) {
    console.error('Error initializing Murder Agent:', error);
    return {
      success: false,
      message: `Error initializing Murder Agent: ${error}`
    };
  }
}

export async function POST() {
  try {
    // Initialize the Murder Agent
    const result = await initializeMurderAgent();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Murder Agent initialization endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize Murder Agent'
    }, { status: 500 });
  }
}
