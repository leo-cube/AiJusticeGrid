# Augment AI Integration

This document outlines how Augment AI is integrated into the Police Investigation System.

## Overview

The Augment AI integration follows a fully dynamic, API-driven architecture with no hardcoded values. All components are:

- Dynamically fetched from the backend
- Customizable via configuration or database changes
- Modular, allowing easy addition or removal of new types or agents

## Architecture

### Key Components

1. **augmentAI.ts Service**
   - Handles communication with the Augment AI API
   - Provides fallback mechanisms when the API is unavailable
   - Maps crime types to specialized AI agents dynamically

2. **API Endpoints**
   - `/api/augment-ai`: Processes AI requests and returns responses
   - `/api/agents`: Returns available AI agents
   - `/api/assignments`: Manages crime type to agent assignments

3. **Configuration**
   - Environment variables in `.env`
   - Default settings in `defaultSettings.json`
   - Dynamic configuration via the settings API

4. **UI Components**
   - Chat interface with agent selection
   - Agent-specific styling and icons
   - Suggested questions based on agent type

## Configuration

### Environment Variables

```
# Feature Flag
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true

# API Configuration
NEXT_PUBLIC_AUGMENT_AI_ENDPOINT=/api/augment-ai
NEXT_PUBLIC_AUGMENT_AI_API_KEY=your-api-key-here
```

### Default Settings

The `defaultSettings.json` file contains default agent types and assignments:

```json
{
  "agentTypes": [
    {
      "id": "general",
      "name": "General Assistant",
      "description": "General investigation assistance and system guidance",
      "avatarColor": "bg-blue-700",
      "capabilities": ["general-assistance", "system-guidance", "basic-investigation"]
    },
    {
      "id": "crime",
      "name": "Crime Agent",
      "description": "Specialized in crime mapping, analysis, and investigation",
      "avatarColor": "bg-red-700",
      "capabilities": ["crime-mapping", "crime-analysis", "evidence-collection"]
    },
    ...
  ],
  "agentAssignments": {
    "theft": "crime",
    "chain-snatching": "crime",
    "murder": "crime",
    "accident": "crime",
    "abuse": "crime",
    "financial-fraud": "financial-fraud",
    "exchange-matching": "exchange-matching"
  }
}
```

## Usage

### Getting AI Responses

```typescript
import augmentAIService from '@/services/augmentAI';

// Get a response from the AI
const response = await augmentAIService.getResponse(
  "Where did the recent financial fraud happen?",
  "financial-fraud"
);

// Map a crime type to an agent type
const agentType = await augmentAIService.getCrimeTypeAgent("theft");
```

### Customizing Agents

Agents can be customized through the Settings page in the application, which updates the configuration via the API.

## Fallback Mechanism

If the Augment AI API is unavailable, the system falls back to local response generation:

1. First tries the local `/api/augment-ai` endpoint
2. If that fails, uses the `agentUtils.ts` module directly

This ensures the system remains functional even when external services are unavailable.

## Adding New Agent Types

To add a new agent type:

1. Add the new agent type to `defaultSettings.json`
2. Create response generation functions in `agentUtils.ts`
3. Update the `AgentType` type in `types.ts`
4. Add an icon for the new agent in `AgentIcon.tsx`

The rest of the system will automatically pick up the new agent type through the API-driven architecture.
