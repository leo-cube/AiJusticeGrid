# Production PDF Download Setup Guide

This guide explains how to set up PDF generation and download functionality for your AI Justice Grid application in production.

## Backend Configuration

### 1. Environment Variables

Add these environment variables to your Render deployment:

```bash
NVIDIA_API_KEY=your_nvidia_api_key_here
FRONTEND_URL=https://aijusticegrid.netlify.app
PDF_DOWNLOAD_ENABLED=true
PDF_MAX_SIZE_MB=10
PYTHONUNBUFFERED=true
```

### 2. Updated Files

The following files have been modified for production PDF support:

- **`.env`** - Added production configuration variables
- **`render.yaml`** - Added environment variables for deployment
- **`unified_server.py`** - Enhanced PDF endpoints with production features

### 3. New API Endpoints

#### `/api/download-report` (POST)
- **Purpose**: Frontend-specific PDF download endpoint
- **Method**: POST
- **Content-Type**: application/json
- **Response**: PDF file download or JSON error

**Request Format:**
```json
{
  "messages": [
    {
      "sender": "assistant",
      "content": "What is the case ID?",
      "agentType": "murder",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "sender": "user", 
      "content": "CASE001",
      "timestamp": "2024-01-15T10:31:00Z"
    }
  ],
  "reportType": "Murder Investigation Report",
  "agentType": "murder",
  "sessionId": "session_123",
  "version": "1.0"
}
```

#### Enhanced `/api/generate-pdf` (POST)
- **Purpose**: General PDF generation with improved production support
- **Features**: Size limits, CORS headers, better error handling

## Frontend Integration

### 1. Update Backend URL

Replace the backend URL in your frontend code:

```javascript
// Development
const BACKEND_URL = 'http://localhost:5000';

// Production
const BACKEND_URL = 'https://your-backend-url.onrender.com';
```

### 2. Download Function Implementation

```javascript
const downloadReport = async (conversationData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/download-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: conversationData.messages,
        reportType: conversationData.reportType || 'Investigation Report',
        agentType: conversationData.agentType || 'general',
        sessionId: conversationData.sessionId,
        version: '1.0'
      })
    });

    if (response.ok && response.headers.get('content-type')?.includes('application/pdf')) {
      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Investigation_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
    }
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
};
```

### 3. Button Integration

Your existing button structure works perfectly:

```html
<div class="mt-4 flex justify-end">
  <button 
    class="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 h-8 px-3 text-xs flex items-center"
    onclick="downloadReport()"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" class="mr-1 h-4 w-4">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"></path>
    </svg>
    Download &amp; Save Report
  </button>
</div>
```

## Production Features

### 1. CORS Support
- Configured for Netlify, Vercel, and custom domains
- Supports preflight OPTIONS requests
- Proper headers for file downloads

### 2. Size Limits
- Configurable PDF size limits (default: 10MB)
- Prevents memory issues in production
- Clear error messages for oversized files

### 3. Error Handling
- Comprehensive error logging
- Fallback PDF generation methods
- User-friendly error messages

### 4. Security
- Environment-based configuration
- Input validation and sanitization
- Secure file handling

## Deployment Steps

### 1. Backend Deployment (Render)

1. Push your updated code to GitHub
2. In Render dashboard, go to your service
3. Add the environment variables listed above
4. Deploy the updated code
5. Test the health endpoint: `https://your-backend-url.onrender.com/api/health`

### 2. Frontend Deployment (Netlify)

1. Update your frontend code with the production backend URL
2. Test the PDF download functionality
3. Deploy to Netlify

### 3. Testing

Use the provided `frontend_pdf_example.html` file to test the integration:

1. Update the backend URL in the file
2. Open in a browser
3. Click "Download & Save Report"
4. Verify PDF downloads correctly

## Troubleshooting

### 502 Error Fix

If you're getting a 502 error, follow these steps:

1. **Check Render Deployment**:
   - Go to your Render dashboard
   - Check if your service is running (should show "Live")
   - Look at the deployment logs for errors

2. **Find Your Backend URL**:
   - In Render dashboard, copy your service URL
   - It should look like: `https://your-service-name.onrender.com`

3. **Test Backend Connection**:
   - Open the `test-backend-connection.html` file in a browser
   - Enter your Render URL and test the connection
   - This will verify your backend is working

4. **Update Frontend**:
   - Replace the backend URL in your frontend code
   - Use the working URL from the connection test

### Common Issues

1. **502 Bad Gateway**: Backend service is not running or crashed
   - Check Render logs for startup errors
   - Verify environment variables are set
   - Ensure gunicorn is starting properly

2. **CORS Errors**: Frontend can't connect to backend
   - Backend CORS is now set to allow all origins
   - Should not be an issue anymore

3. **PDF Generation Fails**: Check NVIDIA_API_KEY is set correctly
4. **File Download Issues**: Verify Content-Disposition headers are exposed
5. **Size Limit Errors**: Adjust PDF_MAX_SIZE_MB if needed

### Debug Endpoints

- Health check: `/api/health/full`
- Test PDF generation: Use the example HTML file
- Check logs in Render dashboard for detailed error information

## Support

If you encounter issues:

1. Check the Render logs for backend errors
2. Use browser developer tools to inspect network requests
3. Verify all environment variables are set correctly
4. Test with the provided example HTML file first

The system is now ready for production PDF downloads with proper error handling, security, and performance optimizations.
