# Environment Setup Guide

This guide explains how to set up the environment variables for the Police Investigation System.

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your actual API keys:**
   ```bash
   # Open in your preferred editor
   nano .env.local
   # or
   code .env.local
   ```

## Environment Variables

### Required Variables

#### `NEXT_PUBLIC_ENABLE_AUGMENT_AI`
- **Description**: Enables/disables Augment AI features
- **Default**: `false`
- **Required Value**: `true`
- **Example**: `NEXT_PUBLIC_ENABLE_AUGMENT_AI=true`

#### `NEXT_PUBLIC_NVIDIA_API_KEY`
- **Description**: Your NVIDIA API key for AI model access
- **Required**: Yes
- **Example**: `NEXT_PUBLIC_NVIDIA_API_KEY=nvapi-your-key-here`
- **How to get**: Visit [NVIDIA API Portal](https://build.nvidia.com/) to get your API key

### Optional Variables

#### `NEXT_PUBLIC_AUGMENT_AI_API_KEY`
- **Description**: Augment AI API key (if using external Augment AI service)
- **Required**: No (has fallback)
- **Example**: `NEXT_PUBLIC_AUGMENT_AI_API_KEY=your-augment-key-here`

#### Agent API URLs
These control where the frontend connects to the backend agents:

```bash
NEXT_PUBLIC_MURDER_AGENT_API_URL=http://127.0.0.1:5000/api/augment/murder
NEXT_PUBLIC_THEFT_AGENT_API_URL=http://127.0.0.1:5001/api/augment/theft
NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL=http://127.0.0.1:5002/api/augment/financial-fraud
```

## Troubleshooting

### "Augment AI Enabled: false" in Console
This means `NEXT_PUBLIC_ENABLE_AUGMENT_AI` is not set to `'true'`. 

**Solution:**
1. Create `.env.local` file in the project root
2. Add: `NEXT_PUBLIC_ENABLE_AUGMENT_AI=true`
3. Restart the development server

### Login Route 404 Errors
If you see repeated `/login 404` errors, this is normal and has been fixed with a redirect system.

### Backend Connection Issues
If agents can't connect to the backend:

1. **Check if the Python backend is running:**
   ```bash
   cd Agents/Agent
   python unified_server.py
   ```

2. **Verify the backend URL in logs:**
   Look for "Murder Agent API URL: http://127.0.0.1:5000/api/augment/murder" in the console

3. **Check firewall/antivirus:**
   Some security software blocks local connections on port 5000

## Development vs Production

### Development (.env.local)
```bash
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true
NEXT_PUBLIC_MURDER_AGENT_API_URL=http://127.0.0.1:5000/api/augment/murder
```

### Production (.env.production)
```bash
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true
NEXT_PUBLIC_MURDER_AGENT_API_URL=https://your-production-api.com/api/augment/murder
```

## Security Notes

- Never commit `.env.local` or `.env.production` files to git
- API keys should be kept secret and rotated regularly
- Use different API keys for development and production
- The `.env.example` file is safe to commit as it contains no real credentials

## Next Steps

After setting up environment variables:

1. **Start the backend:**
   ```bash
   cd Agents/Agent
   python unified_server.py
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Verify setup:**
   - Check console for "Augment AI Enabled: true"
   - Check console for "Murder Agent API URL: http://127.0.0.1:5000/api/augment/murder"
   - Test agent communication in the chat interface
