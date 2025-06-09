# PDF Generation Troubleshooting Guide

## Overview
This guide helps diagnose and fix PDF generation issues in the AI Justice Grid application.

## Quick Diagnosis

### 1. Check System Health
Visit: `https://your-domain.com/api/health`

This will show:
- Frontend status
- PDF generation capability
- Python backend connectivity
- Environment configuration

### 2. Test PDF Generation
POST to: `https://your-domain.com/api/health`

This will test the complete PDF generation pipeline.

## Common Issues and Solutions

### Issue 1: "Failed to generate PDF" in Production

**Symptoms:**
- PDF generation works locally but fails in production
- Error messages about backend connectivity
- Timeouts during PDF generation

**Root Cause:**
The application tries to connect to a Python backend for PDF generation, but the backend is not properly configured or accessible in production.

**Solution:**
The application now includes automatic fallback to client-side PDF generation using jsPDF when the Python backend is unavailable.

**Environment Variables to Check:**
```bash
# Optional - only set if you have a Python backend
PYTHON_BACKEND_URL=https://your-python-backend.onrender.com

# If not set, the system will use client-side generation
```

### Issue 2: PDF Generation Timeouts

**Symptoms:**
- PDF generation starts but never completes
- Browser shows "waiting for response"
- No error messages in console

**Solution:**
- Increased timeout to 60 seconds
- Added abort controller for proper timeout handling
- Automatic fallback to client-side generation

### Issue 3: Missing Dependencies

**Symptoms:**
- Build errors mentioning jsPDF
- Runtime errors about missing modules

**Solution:**
Ensure jsPDF is properly installed:
```bash
npm install jspdf@^3.0.1
```

### Issue 4: CORS Issues with Python Backend

**Symptoms:**
- CORS errors in browser console
- PDF generation fails with network errors

**Solution:**
Configure your Python backend to allow requests from your frontend domain:
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://your-frontend-domain.com'])
```

## Environment Configuration

### For Client-Side Only (Recommended for most deployments)
```bash
# Don't set PYTHON_BACKEND_URL
# The system will automatically use client-side generation
```

### For Hybrid Setup (Python backend + fallback)
```bash
PYTHON_BACKEND_URL=https://your-python-backend.onrender.com
```

## Testing Your Setup

### 1. Local Testing
```bash
npm run dev
# Navigate to your app and try generating a PDF
```

### 2. Production Testing
```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test PDF generation
curl -X POST https://your-domain.com/api/health \
  -H "Content-Type: application/json"
```

### 3. Browser Testing
1. Open browser developer tools
2. Go to Network tab
3. Try generating a PDF
4. Check for any failed requests or errors

## Performance Optimization

### Client-Side PDF Generation
- ✅ No external dependencies
- ✅ Works offline
- ✅ Fast generation for small reports
- ⚠️ Limited formatting options
- ⚠️ Browser memory limitations for large reports

### Python Backend PDF Generation
- ✅ Advanced formatting capabilities
- ✅ Better handling of large reports
- ✅ Server-side processing
- ⚠️ Requires additional infrastructure
- ⚠️ Network dependency

## Monitoring and Logging

### Frontend Logs
Check browser console for:
- PDF generation start/completion messages
- Error messages with specific details
- Network request failures

### Backend Logs
If using Python backend, check server logs for:
- Incoming PDF generation requests
- Processing errors
- Response generation

### Health Check Monitoring
Set up monitoring for:
- `/api/health` endpoint availability
- PDF generation success rate
- Response times

## Support and Debugging

### Debug Information to Collect
1. Browser console logs
2. Network tab showing failed requests
3. Health check response
4. Environment variables (without sensitive values)
5. Error messages and stack traces

### Common Error Messages

**"PDF generation timed out"**
- Increase timeout values
- Check network connectivity
- Verify backend availability

**"Failed to generate PDF: Unknown error"**
- Check browser console for detailed errors
- Verify all dependencies are installed
- Test with health check endpoint

**"Python backend unreachable"**
- Verify PYTHON_BACKEND_URL is correct
- Check backend server status
- Ensure CORS is properly configured

## Recent Improvements

### Version 2.0 Features
- ✅ Automatic fallback to client-side generation
- ✅ Improved error handling and user feedback
- ✅ Timeout protection (60 seconds)
- ✅ Health check endpoints
- ✅ Better logging and debugging
- ✅ Graceful degradation when backend unavailable

### Backward Compatibility
- All existing PDF generation functionality preserved
- No breaking changes to API
- Automatic migration to improved system
