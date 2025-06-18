# Quick Frontend Deployment Setup

## Step 1: Choose Your Platform
- **Vercel** (Recommended for Next.js): https://vercel.com
- **Netlify**: https://netlify.com  
- **Railway**: https://railway.app
- **DigitalOcean**: https://digitalocean.com/products/app-platform

## Step 2: Environment Variables to Set

Copy these exact values to your hosting platform's environment variables section:

```
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true
NEXT_PUBLIC_AUGMENT_AI_ENDPOINT=/api/augment-ai
NEXT_PUBLIC_MURDER_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/murder
NEXT_PUBLIC_THEFT_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/theft
NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL=https://aijusticegrid.onrender.com/api/augment/financial-fraud
NODE_ENV=production
```

**You need to add your own API keys:**
```
NEXT_PUBLIC_AUGMENT_AI_API_KEY=your-actual-augment-ai-key
NEXT_PUBLIC_NVIDIA_API_KEY=your-actual-nvidia-key
NEXTAUTH_SECRET=your-secure-random-string
```

**After deployment, update this with your actual frontend URL:**
```
NEXTAUTH_URL=https://your-deployed-frontend-url.com
```

## Step 3: Build Settings
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18+ (set in platform settings if needed)
- **Root Directory**: `investigation-main` (if deploying from repo root)

## Step 4: Deploy
1. Connect your GitHub repository
2. Set the environment variables above
3. Deploy!

Your frontend will connect to your backend at: `https://aijusticegrid.onrender.com`
