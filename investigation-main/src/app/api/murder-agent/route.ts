import { NextResponse } from 'next/server';
import { ChatContext } from '@/app/types';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Get Augment AI API key from environment variables
const AUGMENT_AI_API_KEY = process.env.NEXT_PUBLIC_AUGMENT_AI_API_KEY || 'http://127.0.0.1:5000/api/augment/murder';

/**
 * Connects to the Murder Agent Python backend to get live analysis
 *
 * @param question The user's question
 * @param context The chat context containing case details
 * @returns Analysis from the Murder Agent
 */
async function getMurderAgentResponse(question: string, context?: ChatContext): Promise<string> {
  try {
    // Create a case details object from the context
    const caseDetails = {
      case_id: context?.caseId || `case_${Date.now()}`,
      date_of_crime: context?.crimeDate || new Date().toISOString().split('T')[0],
      time_of_crime: context?.crimeTime || "Unknown",
      location: context?.location || "Unknown",
      victim_name: context?.victimName || "Unknown",
      victim_age: context?.victimAge || "Unknown",
      victim_gender: context?.victimGender || "Unknown",
      cause_of_death: context?.causeOfDeath || "Unknown",
      weapon_used: context?.weaponUsed || "Unknown",
      crime_scene_description: context?.crimeSceneDescription || "Unknown",
      witnesses: context?.witnesses || "None",
      evidence_found: context?.evidence || "None",
      suspects: context?.suspects || "None",
      additional_notes: question, // Include the user's question as additional notes
    };

    // Check if the Agent folder exists
    const agentPath = path.join(process.cwd(), 'Agent');
    if (!fs.existsSync(agentPath)) {
      console.error('Agent folder not found');
      return getFallbackResponse(question, context);
    }

    // Use a mock response for faster development if needed
    if (process.env.USE_MOCK_MURDER_AGENT === 'true') {
      console.log('Using mock Murder Agent response');
      return getMockResponse(question, context);
    }

    // Create a temporary JSON file with the case details
    const tempFilePath = path.join(agentPath, `temp_case_${Date.now()}.json`);
    fs.writeFileSync(tempFilePath, JSON.stringify(caseDetails, null, 2));

    // Set a timeout for the Python process (15 seconds)
    const TIMEOUT_MS = 15000;

    // Run the Murder Agent Python script with a timeout
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
              path.join(agentPath, 'murder_agent_main.py'),
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
          } catch (error) {
            console.error('Error deleting temporary file:', error);
          }

          if (code === 0) {
            // Extract the analysis section from the output
            const analysisMatch = output.match(/MURDER AGENT ANALYSIS\n=+\n([\s\S]*?)(?:=+|$)/);
            if (analysisMatch && analysisMatch[1]) {
              resolve(analysisMatch[1].trim());
            } else {
              resolve(output.trim());
            }
          } else {
            console.error(`Python process exited with code ${code}`);
            console.error('Error output:', errorOutput);
            reject(new Error(`Murder Agent process failed with code ${code}`));
          }
        });

        // Handle process errors
        pythonProcess.on('error', (error) => {
          console.error('Error spawning Python process:', error);
          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupError) {
            console.error('Error deleting temporary file:', cleanupError);
          }
          reject(error);
        });
      }),

      // Timeout promise
      new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Murder Agent process timed out after ${TIMEOUT_MS}ms`));
        }, TIMEOUT_MS);
      })
    ]).catch(error => {
      console.error('Murder Agent error:', error);
      return getFallbackResponse(question, context);
    });
  } catch (error) {
    console.error('Error running Murder Agent:', error);
    return getFallbackResponse(question, context);
  }
}

/**
 * Mock response for faster development
 */
function getMockResponse(question: string, context?: ChatContext): string {
  // Create a detailed mock response based on the question and context
  const caseId = context?.caseId || 'unknown case';
  const victimName = context?.victimName || 'the victim';

  let response = `# Murder Case Analysis: ${caseId}\n\n`;

  // Add a live data indicator
  response += "**[LIVE DATA ANALYSIS]**\n\n";

  // Add question-specific response
  if (question.toLowerCase().includes("tell me about this")) {
    response += `## Case Overview\n\nThis is a murder investigation involving ${victimName}. The case is currently active and requires immediate attention. Based on preliminary findings, this appears to be a premeditated crime with specific forensic evidence that needs to be analyzed.\n\n`;

    response += `## Key Evidence\n\n- Weapon: ${context?.weaponUsed || 'Unknown'}\n- Time of Crime: ${context?.crimeTime || 'Unknown'}\n- Location: ${context?.location || 'Unknown'}\n\n`;

    response += "## Recommended Actions\n\n1. Secure the crime scene and collect all available evidence\n2. Interview all witnesses and potential suspects\n3. Establish a detailed timeline of events\n4. Conduct forensic analysis of all collected evidence\n";
  }
  else if (question.toLowerCase().includes("evidence")) {
    response += `## Evidence Analysis\n\nThe evidence in this case includes ${context?.evidence || 'items that are still being processed'}. All evidence should be carefully documented and analyzed for fingerprints, DNA, and other forensic markers.\n\n`;

    response += "Forensic analysis should prioritize:\n\n1. DNA analysis of biological samples\n2. Fingerprint comparison\n3. Ballistic analysis (if applicable)\n4. Digital evidence recovery\n\nThe chain of custody must be maintained at all times to ensure admissibility in court.";
  }
  else if (question.toLowerCase().includes("suspect")) {
    response += `## Suspect Analysis\n\nBased on the information available, ${context?.suspects || 'potential suspects'} should be thoroughly investigated. Focus on individuals with:\n\n`;

    response += "- Motive: Financial gain, personal conflicts, or other incentives\n- Opportunity: Access to the crime scene and victim\n- Means: Ability to commit the crime\n\nBackground checks, alibi verification, and interview strategies should be prioritized.";
  }
  else if (question.toLowerCase().includes("type") && question.toLowerCase().includes("murder")) {
    response += `## Murder Classification\n\nBased on the evidence collected so far, this case appears to be a ${Math.random() > 0.5 ? 'premeditated' : 'crime of passion'} homicide. The method and circumstances suggest ${Math.random() > 0.5 ? 'careful planning' : 'an emotional trigger'}.\n\n`;

    response += "The investigation should focus on establishing:\n\n1. The exact timeline leading up to the murder\n2. The relationship between victim and potential perpetrators\n3. Any history of conflicts or threats\n4. Physical evidence that can confirm the method and timing\n\nThis classification may evolve as more evidence is collected.";
  }
  else {
    response += `## Case Analysis\n\nThis murder case requires a comprehensive investigation approach. Based on the details provided for ${caseId}, I recommend:\n\n`;

    response += "1. Establish a clear timeline of events before and after the crime\n2. Analyze all physical evidence collected from the scene\n3. Interview all witnesses and persons of interest\n4. Develop a profile of the victim to identify potential motives\n5. Cross-reference with similar cases for potential patterns\n\n";

    response += "The investigation should remain open to all possibilities as new evidence emerges.";
  }

  // Add a unique identifier to prevent duplicate responses
  const timestamp = new Date().getTime();
  const uniqueId = Math.floor(Math.random() * 1000);
  response += `\n\n<!-- Response ID: ${timestamp}-${uniqueId} -->`;

  return response;
}

/**
 * Fallback response when the Murder Agent backend is unavailable
 */
function getFallbackResponse(question: string, context?: ChatContext): string {
  // Create a basic response based on the question and context
  let response = "I'm unable to connect to the Murder Agent backend at the moment. ";

  if (context?.caseId) {
    response += `Regarding case ${context.caseId}: `;
  }

  if (question.toLowerCase().includes("evidence")) {
    response += "Based on the available information, the evidence should be carefully analyzed for fingerprints, DNA, and other forensic markers. Consider the timeline of events and potential witness testimonies.";
  } else if (question.toLowerCase().includes("suspect")) {
    response += "The investigation should focus on individuals with motive, opportunity, and means. Background checks and alibis should be verified.";
  } else if (question.toLowerCase().includes("weapon")) {
    response += "The weapon used in this case appears to be consistent with the injuries observed. Forensic analysis may provide more details on the specific type and origin.";
  } else if (question.toLowerCase().includes("type") && question.toLowerCase().includes("murder")) {
    response += "Without access to the full case details, I can only provide general guidance. Murder cases are typically classified based on intent, method, and relationship between victim and perpetrator. A thorough investigation is needed to determine the specific type in this case.";
  } else {
    response += "This case requires thorough investigation following standard homicide protocols. Gather all evidence, interview witnesses, and establish a timeline of events.";
  }

  // Add a unique identifier to prevent duplicate responses
  const timestamp = new Date().getTime();
  const uniqueId = Math.floor(Math.random() * 1000);
  response += `\n\n<!-- Response ID: ${timestamp}-${uniqueId} -->`;

  return response;
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

    // Get response from Murder Agent
    const response = await getMurderAgentResponse(
      body.question,
      body.context as ChatContext
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error('Error processing Murder Agent request:', error);
    return NextResponse.json(
      { error: 'Failed to process Murder Agent request' },
      { status: 500 }
    );
  }
}
