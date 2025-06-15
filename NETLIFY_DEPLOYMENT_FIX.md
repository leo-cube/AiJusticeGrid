# Netlify Deployment Fix for PDF Generation

## Problem
Your frontend on Netlify (https://clientside01.netlify.app/) is trying to call `/api/generate-pdf` on itself instead of your backend on Render (https://aijusticegrid.onrender.com/). This causes a 500 error because Netlify only serves static files and doesn't have the PDF generation API.

## Solution
You need to set the correct environment variables in your Netlify deployment.

## Required Environment Variables for Netlify

Go to your Netlify dashboard → Site settings → Environment variables and add these:

### Core Backend Configuration
```
PYTHON_BACKEND_URL=https://aijusticegrid.onrender.com
BACKEND_URL=https://aijusticegrid.onrender.com
```

### API Keys
```
NEXT_PUBLIC_NVIDIA_API_KEY=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
```

### Agent API URLs
```
NEXT_PUBLIC_MURDER_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/murder
NEXT_PUBLIC_THEFT_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/theft
NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/financial-fraud
```

### Authentication Configuration
```
NEXTAUTH_URL=https://clientside01.netlify.app
NEXTAUTH_SECRET=your-strong-random-secret-here
```

### Environment
```
NODE_ENV=production
```

## Step-by-Step Fix Instructions

### 1. Update Netlify Environment Variables
1. Go to https://app.netlify.com/
2. Select your site (clientside01)
3. Go to Site settings → Environment variables
4. Add all the variables listed above
5. **IMPORTANT**: Make sure `PYTHON_BACKEND_URL` is set to `https://aijusticegrid.onrender.com`

### 2. Redeploy Your Site
After adding the environment variables:
1. Go to Deploys tab
2. Click "Trigger deploy" → "Deploy site"
3. Wait for the deployment to complete

### 3. Test the Fix
1. Go to your frontend: https://clientside01.netlify.app/
2. Use the Murder Agent to generate an analysis
3. Click "Download & Save Report"
4. The PDF should now generate successfully

## What This Fixes

- **Before**: Frontend calls `/api/generate-pdf` on Netlify → 500 error (no backend)
- **After**: Frontend calls `/api/generate-pdf` on Netlify → Next.js API route forwards to `https://aijusticegrid.onrender.com/api/generate-pdf` → PDF generated successfully

## Verification

After deployment, check the browser's Network tab:
1. The request should go to: `https://clientside01.netlify.app/api/generate-pdf`
2. Your Next.js API route should forward it to: `https://aijusticegrid.onrender.com/api/generate-pdf`
3. You should receive a PDF file as response

## Backend CORS Check

Make sure your backend allows requests from your Netlify domain. Your backend should have CORS configured to accept requests from `https://clientside01.netlify.app`.

## Troubleshooting

If you still get errors after this fix:
1. Check Netlify function logs for any errors
2. Verify all environment variables are set correctly
3. Test your backend directly: `https://aijusticegrid.onrender.com/api/generate-pdf`
4. Check browser console for any CORS errors
