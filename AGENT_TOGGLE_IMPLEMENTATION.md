# Agent Toggle Functionality Implementation

## Overview
This document outlines the implementation of the agent toggle functionality transferred from `frontend-logesh4` to the main `frontend` folder. This critical update enables users to toggle AI agents on/off in the settings page, with those enabled agents appearing in the crime investigation sidebar.

**🎯 Key Integration**: The system now reads from and writes to `data/agent-settings.json` file, ensuring persistent agent configuration across sessions.

## Key Features Implemented

### 1. Agent Toggle Settings
- **Location**: Settings → Agent Configuration tab
- **Functionality**: Toggle switches for each AI agent (General Assistant, Finance Agent, Theft Agent, etc.)
- **Real-time Updates**: Changes are immediately reflected in the UI
- **Persistence**: Settings are saved to `data/agent-settings.json` file and synced with backend API
- **File Integration**: Reads from and writes to the agent-settings.json file structure

### 2. Dynamic Crime Page
- **Location**: Crime Investigation page
- **Functionality**: Only enabled agents appear in the crime investigation interface
- **Integration**: Seamlessly integrates with the agent toggle service
- **Refresh Button**: Added refresh functionality to immediately see changes
- **Debug Logging**: Enhanced console logging for troubleshooting

### 3. Backend API Integration
- **Endpoints**: New `/api/augment/` endpoints for agent management
- **File System**: Direct integration with `data/agent-settings.json`
- **Fallback**: Graceful degradation when backend is unavailable
- **Local Storage**: Persistent local storage for offline functionality

### 4. Agent Settings File Structure
```json
{
  "enabledAgents": {
    "general": false,
    "murder": true,
    "finance": true,
    "theft": false,
    "smuggle": false,
    "crime-accident": false,
    "crime-abuse": false
  },
  "lastUpdated": "2025-06-02T19:02:40.097Z"
}
```

## Files Created/Modified

### New API Endpoints
1. **`/src/app/api/augment/toggle-agent/route.ts`**
   - GET: Retrieve enabled agents
   - POST: Toggle individual agent status
   - PUT: Alternative toggle endpoint
   - PATCH: Bulk agent updates

2. **`/src/app/api/augment/update-agents/route.ts`**
   - POST: Update multiple agent statuses at once

3. **`/src/app/api/augment-ai/route.ts`**
   - POST: Augment AI requests
   - GET: Augment AI status

### Modified Components
1. **`/src/app/components/settings/AugmentAIConfig.tsx`**
   - Complete rewrite with agent toggle functionality
   - Visual toggle switches for each agent
   - Real-time status indicators
   - Save/load functionality

2. **`/src/app/(dashboard)/crime/page.tsx`**
   - Enhanced to filter agents based on enabled status
   - Dynamic agent loading from toggle service
   - Fallback to default settings when service unavailable

### Modified Services
1. **`/src/services/agentToggleService.ts`**
   - Updated to use new `/api/augment/toggle-agent` endpoint
   - Enhanced error handling and fallback mechanisms
   - Local storage integration

### Configuration Updates
1. **`.env.example`**
   - Added `NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL` configuration
   - Updated for production deployment compatibility

## How It Works

### 1. Settings Page Flow
1. User navigates to Settings → Agent Configuration
2. AugmentAIConfig component loads current agent statuses
3. User toggles agents on/off using toggle switches
4. Changes are immediately saved to backend and localStorage
5. Visual feedback shows save status (pending/success/error)

### 2. Crime Page Flow
1. User navigates to Crime Investigation page
2. Page fetches enabled agents from agentToggleService
3. Only enabled agents are displayed in the interface
4. Users can click "Talk to [Agent]" for enabled agents
5. Disabled agents are hidden from the interface

### 3. Data Flow
```
Settings Page → agentToggleService → API Endpoint → Backend
                     ↓
Crime Page ← agentToggleService ← localStorage (fallback)
```

## API Endpoints

### Toggle Agent Status
```
POST /api/augment/toggle-agent
Body: { "agentId": "finance", "enabled": true }
Response: { "success": true, "agentId": "finance", "enabled": true }
```

### Get Enabled Agents
```
GET /api/augment/toggle-agent
Response: { "success": true, "data": { "finance": true, "theft": false, ... } }
```

### Update Multiple Agents
```
POST /api/augment/update-agents
Body: { "agents": { "finance": true, "theft": false, "murder": true } }
Response: { "success": true, "agents": { ... } }
```

## Environment Variables

### Required Environment Variables
```bash
# Unified Agent Server URL
NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL=https://aijusticegrid.onrender.com

# Augment AI Configuration
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true
NEXT_PUBLIC_AUGMENT_AI_API_KEY=your-api-key
NEXT_PUBLIC_AUGMENT_AI_ENDPOINT=/api/augment-ai
```

## Error Handling

### Graceful Degradation
- **Backend Unavailable**: Falls back to localStorage
- **API Errors**: Shows warning indicators but maintains UI state
- **Network Issues**: Continues with local-only operation

### User Feedback
- **Pending**: Yellow indicator during API calls
- **Success**: Green indicator for successful updates
- **Warning**: Orange indicator for local-only updates
- **Error**: Red indicator for failed operations

## Testing

### Manual Testing Steps
1. **Settings Page**:
   - Navigate to Settings → Agent Configuration
   - Toggle various agents on/off
   - Verify visual feedback and save functionality
   - Check browser localStorage for persistence

2. **Crime Page**:
   - Navigate to Crime Investigation
   - Verify only enabled agents appear
   - Toggle agents in settings and refresh crime page
   - Confirm agent visibility updates correctly

3. **Error Scenarios**:
   - Disconnect network and test offline functionality
   - Verify localStorage fallback works
   - Check error indicators appear appropriately

## Production Deployment

### Backend Requirements
- Unified agent server must be running at configured URL
- Backend must implement corresponding API endpoints
- CORS must be configured for frontend domain

### Frontend Deployment
- Environment variables must be set correctly
- Build process should include all new API routes
- Static assets should be properly deployed

## Security Considerations

### Data Protection
- Agent settings stored in localStorage (client-side only)
- No sensitive data transmitted in agent toggle requests
- API endpoints use standard HTTP methods with JSON payloads

### Access Control
- No authentication required for agent toggle (internal system)
- Backend should implement appropriate access controls
- Frontend assumes authorized user access

## Maintenance

### Monitoring
- Monitor API endpoint response times
- Track localStorage usage and cleanup
- Watch for console errors in agent toggle operations

### Updates
- Agent list is configurable via `defaultSettings.json`
- New agents can be added without code changes
- Toggle functionality is extensible for future agent types

## Troubleshooting

### Common Issues
1. **Agents not appearing**: Check enabled status in settings
2. **Toggle not saving**: Verify backend connectivity
3. **Settings not persisting**: Check localStorage permissions
4. **API errors**: Verify environment variable configuration

### Debug Steps
1. Check browser console for errors
2. Verify network requests in DevTools
3. Inspect localStorage for agent settings
4. Test backend API endpoints directly

## Success Criteria

✅ **Completed Successfully**:
- Agent toggle switches in settings page
- Dynamic agent filtering in crime page
- Backend API integration with fallback
- Local storage persistence
- Error handling and user feedback
- Environment configuration
- Documentation and testing guidelines

This implementation provides a robust, user-friendly agent management system that enhances the investigation workflow while maintaining system reliability and performance.
