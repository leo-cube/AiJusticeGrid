import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ChatContext } from '@/app/types';

// Finance Agent API URL
const FINANCE_AGENT_API_URL = process.env.NEXT_PUBLIC_FINANCE_AGENT_API_URL || 'http://localhost:5000/api/augment/finance';

/**
 * Connects to the Finance Agent Python backend to get live analysis
 *
 * @param question The user's question
 * @param context The chat context containing case details
 * @returns Analysis from the Finance Agent
 */
async function getFinanceAgentResponse(question: string, context?: ChatContext): Promise<string> {
  try {
    // Create a case details object from the context
    const caseDetails = {
      case_id: context?.caseId || `case_${Date.now()}`,
      date_of_incident: context?.crimeDate || new Date().toISOString().split('T')[0],
      time_of_discovery: context?.crimeTime || "Unknown",
      financial_institution: context?.location || "Unknown",
      victim_name: context?.victimName || "Unknown",
      account_type: context?.victimAge || "Unknown",
      account_number: context?.victimGender || "Unknown",
      fraud_type: context?.causeOfDeath || "Unknown",
      amount_involved: context?.weaponUsed || "Unknown",
      method_used: context?.crimeSceneDescription || "Unknown",
      suspicious_activity: context?.suspects || "Unknown",
      evidence_collected: context?.evidenceFound || "Unknown",
      suspects: context?.witnesses || "Unknown",
      additional_notes: context?.additionalNotes || question
    };

    // Get the path to the Finance Agent
    const agentPath = path.join(process.cwd(), 'Agents', 'Agent', 'FinancialAgent');
    const AUGMENT_AI_API_KEY = process.env.AUGMENT_AI_API_KEY || 'default-key';

    // Use a mock response for faster development if needed
    if (process.env.USE_MOCK_FINANCE_AGENT === 'true') {
      console.log('Using mock Finance Agent response');
      return getMockResponse(question, context);
    }

    // Create a temporary JSON file with the case details
    const tempFilePath = path.join(agentPath, `temp_case_${Date.now()}.json`);
    fs.writeFileSync(tempFilePath, JSON.stringify(caseDetails, null, 2));

    // Set a timeout for the Python process (15 seconds)
    const TIMEOUT_MS = 15000;

    // Run the Finance Agent Python script with a timeout
    return Promise.race([
      new Promise<string>((resolve, reject) => {
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
            pythonProcess = spawn(cmd, [
              path.join(agentPath, 'financial_fraud_agent_main.py'),
              '--case_file', tempFilePath,
              '--api_key', AUGMENT_AI_API_KEY
            ]);

            // If we get here without an error, break the loop
            break;
          } catch (error) {
            spawnErrors += `Failed to spawn Python process with ${cmd}: ${error}\n`;
            // Continue to the next command
          }
        }

        // If no Python command worked, reject the promise
        if (!pythonProcess) {
          reject(new Error(`Failed to spawn Python process: ${spawnErrors}`));
          return;
        }

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
          // Clean up the temporary file
          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError);
          }

          if (code === 0) {
            resolve(output.trim() || 'Finance Agent analysis completed successfully.');
          } else {
            reject(new Error(`Finance Agent process exited with code ${code}. Error: ${errorOutput}`));
          }
        });

        pythonProcess.on('error', (error) => {
          // Clean up the temporary file
          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError);
          }
          reject(new Error(`Failed to start Finance Agent process: ${error.message}`));
        });
      }),
      new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Finance Agent process timed out'));
        }, TIMEOUT_MS);
      })
    ]);

  } catch (error) {
    console.error('Error in getFinanceAgentResponse:', error);
    return getMockResponse(question, context);
  }
}

/**
 * Generate a mock response for development/fallback purposes
 */
function getMockResponse(question: string, context?: ChatContext): string {
  const caseId = context?.caseId || 'FRAUD-001';
  const fraudType = context?.causeOfDeath || 'Credit Card Fraud';
  const amount = context?.weaponUsed || '$5,000';
  
  return `# FINANCIAL FRAUD CASE ANALYSIS

**Case ID:** ${caseId}
**Fraud Type:** ${fraudType}
**Amount Involved:** ${amount}

## CASE OVERVIEW
This appears to be a ${fraudType} case involving financial losses of ${amount}. Based on the information provided, this requires immediate investigation and response.

## INVESTIGATIVE RECOMMENDATIONS
1. **Immediate Actions:**
   - Secure all affected accounts
   - Preserve digital evidence
   - Contact relevant financial institutions

2. **Evidence Collection:**
   - Transaction logs and timestamps
   - IP addresses and device information
   - Communication records

3. **Recovery Strategies:**
   - Work with financial institutions for fund recovery
   - File appropriate reports with authorities
   - Implement enhanced security measures

## PREVENTION MEASURES
- Enhanced authentication protocols
- Regular account monitoring
- Employee/customer education programs
- Advanced fraud detection systems

---
*This analysis is based on the provided case details and standard financial fraud investigation protocols.*

**Question Asked:** ${question}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.question) {
      return NextResponse.json(
        { error: 'Missing required field: question' },
        { status: 400 }
      );
    }

    // Get response from Finance Agent
    const response = await getFinanceAgentResponse(
      body.question,
      body.context as ChatContext
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error('Error processing Finance Agent request:', error);
    return NextResponse.json(
      { error: 'Failed to process Finance Agent request' },
      { status: 500 }
    );
  }
}
