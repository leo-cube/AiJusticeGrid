# Frontend Deployment Guide

This guide will help you deploy the AI Justice Grid frontend to various hosting platforms while connecting to your backend at `https://aijusticegrid.onrender.com`.

## Environment Variables for Production

When deploying to any frontend platform, you'll need to set these environment variables:

### Required Environment Variables

```bash
# Augment AI Configuration
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true
NEXT_PUBLIC_AUGMENT_AI_API_KEY=your-augment-ai-api-key-here
NEXT_PUBLIC_AUGMENT_AI_ENDPOINT=/api/augment-ai

# NVIDIA API Configuration
NEXT_PUBLIC_NVIDIA_API_KEY=your-nvidia-api-key-here

# Backend API URLs (pointing to your deployed backend)
NEXT_PUBLIC_MURDER_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/murder
NEXT_PUBLIC_THEFT_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/theft
NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/financial-fraud

# NextAuth Configuration
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-here

# Environment
NODE_ENV=production
```

## Platform-Specific Deployment Instructions

### 1. Vercel Deployment

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `investigation-main` folder as the root directory

2. **Configure Environment Variables:**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all the variables listed above
   - Set `NEXTAUTH_URL` to your Vercel domain (e.g., `https://your-app.vercel.app`)

3. **Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 2. Netlify Deployment

1. **Connect Repository:**
   - Go to [netlify.com](https://netlify.com)
   - New site from Git → Choose your repository
   - Set base directory to `investigation-main`

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables:**
   - Go to Site settings → Environment variables
   - Add all the variables listed above
   - Set `NEXTAUTH_URL` to your Netlify domain

### 3. Railway Deployment

1. **Connect Repository:**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub repo

2. **Configuration:**
   - Add environment variables in the Variables tab
   - Railway will auto-detect Next.js and configure build settings

### 4. DigitalOcean App Platform

1. **Create App:**
   - Go to DigitalOcean → Apps → Create App
   - Connect your GitHub repository

2. **Configure:**
   - Set source directory to `investigation-main`
   - Add environment variables in the app settings

## Important Notes

### CORS Configuration
Make sure your backend at `https://aijusticegrid.onrender.com` allows requests from your frontend domain. You may need to update CORS settings in your backend.

### API Keys
- Replace `your-augment-ai-api-key-here` with your actual Augment AI API key
- Replace `your-nvidia-api-key-here` with your actual NVIDIA API key
- Generate a secure random string for `NEXTAUTH_SECRET`

### Domain Configuration
- Update `NEXTAUTH_URL` with your actual frontend domain after deployment
- This is crucial for NextAuth to work properly

## Testing Your Deployment

After deployment, test these endpoints:
1. Frontend loads correctly
2. API calls to backend work (check browser network tab)
3. Authentication flows work (if using NextAuth)

## Troubleshooting

### Common Issues:
1. **API calls failing:** Check CORS settings on backend
2. **Environment variables not working:** Ensure they start with `NEXT_PUBLIC_` for client-side access
3. **Build failures:** Check Node.js version compatibility (use Node 18+)

### Backend Health Check:
Test your backend is accessible: `https://aijusticegrid.onrender.com/health` (if you have a health endpoint)
