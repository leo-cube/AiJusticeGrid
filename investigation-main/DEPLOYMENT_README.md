# 🚀 AI Justice Grid - Production Deployment

## Overview
This is the production-ready AI Justice Grid system with frontend and backend separated for independent deployment.

## 📦 Package Contents

### Frontend Package (`investigation-main/`)
- **Next.js Application** - Complete frontend application
- **Production Optimized** - Standalone build configuration
- **Environment Ready** - Configurable for any backend URL
- **Clean Codebase** - All test files and mocks removed

### Backend Package (`backend/`)
- **Unified Server** - Single Python server handling all agents
- **Agent APIs** - Murder, Theft, Financial Fraud agents
- **PDF Generation** - Complete report generation system
- **Data Storage** - Case management and persistence

---

## 🔧 Quick Deployment Guide

### 1. Backend Deployment

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
echo "NVIDIA_API_KEY=your-nvidia-api-key" > .env

# Start the server
python unified_server.py
```

**Backend will run on**: `http://localhost:5000`

### 2. Frontend Deployment

```bash
# Navigate to frontend directory
cd investigation-main

# Install dependencies
npm install

# Configure environment variables
cat > .env << EOF
NEXT_PUBLIC_API_BASE_URL=https://your-backend-server.com/api
NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL=https://your-backend-server.com
NEXT_PUBLIC_MURDER_AGENT_API_URL=https://your-backend-server.com/api/augment/murder
NEXT_PUBLIC_THEFT_AGENT_API_URL=https://your-backend-server.com/api/augment/theft
NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL=https://your-backend-server.com/api/augment/financial-fraud
NEXT_PUBLIC_NVIDIA_API_KEY=your-nvidia-api-key
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true
EOF

# Build for production
npm run build

# Start production server
npm start
```

**Frontend will run on**: `http://localhost:3000`

---

## 🌐 Environment Configuration

### Required Environment Variables

#### Frontend (`.env`)
```bash
# Backend API URLs
NEXT_PUBLIC_API_BASE_URL=https://your-backend-server.com/api
NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL=https://your-backend-server.com

# Agent URLs
NEXT_PUBLIC_MURDER_AGENT_API_URL=https://your-backend-server.com/api/augment/murder
NEXT_PUBLIC_THEFT_AGENT_API_URL=https://your-backend-server.com/api/augment/theft
NEXT_PUBLIC_FINANCIAL_FRAUD_AGENT_API_URL=https://your-backend-server.com/api/augment/financial-fraud

# API Keys
NEXT_PUBLIC_NVIDIA_API_KEY=your-nvidia-api-key
NEXT_PUBLIC_ENABLE_AUGMENT_AI=true
```

#### Backend (`.env`)
```bash
# API Key
NVIDIA_API_KEY=your-nvidia-api-key
```

---

## 🐳 Docker Deployment

### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "unified_server.py"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NVIDIA_API_KEY=your-nvidia-api-key
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./investigation-main
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://backend:5000/api
      - NEXT_PUBLIC_UNIFIED_AGENT_SERVER_URL=http://backend:5000
      - NEXT_PUBLIC_NVIDIA_API_KEY=your-nvidia-api-key
    depends_on:
      - backend
```

---

## 🔍 Verification

### Test Backend
```bash
curl http://your-backend-server:5000/health
```

### Test Frontend
Open browser: `http://your-frontend-server:3000`

### Test Agent Communication
1. Navigate to agent chat interface
2. Send a test message
3. Verify response from backend

### Test PDF Generation
1. Complete an agent conversation
2. Click "Generate Report"
3. Verify PDF downloads correctly

---

## 📋 Production Checklist

- [ ] Backend server running and accessible
- [ ] Frontend environment variables configured
- [ ] CORS allows frontend domain
- [ ] NVIDIA API key is valid
- [ ] All agents respond to test queries
- [ ] PDF generation works
- [ ] Data persistence functions
- [ ] HTTPS enabled (recommended)

---

## 🚨 Security Notes

1. **API Keys**: Store securely, never commit to version control
2. **CORS**: Update backend to allow only your frontend domain
3. **HTTPS**: Use HTTPS in production
4. **Firewall**: Configure appropriate network security

---

## 📞 Support

- **Health Check**: `GET /health`
- **Agent Status**: `GET /api/health/full`
- **Logs**: Check `unified_agent_server.log` in backend directory

---

## 🎉 Success!

Your AI Justice Grid is now ready for production deployment with complete separation between frontend and backend services!
