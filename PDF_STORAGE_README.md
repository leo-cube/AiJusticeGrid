# PDF Storage and Download System

## Overview

This document describes the new PDF storage and download functionality that solves the 502 error issue when downloading PDFs from the frontend after deployment. The system now automatically generates and stores PDFs after analysis completion, allowing users to download them later without regenerating.

## 🔧 What Was Fixed

### Previous Issues:
- **502 Error on Frontend**: PDF generation worked in backend but frontend received 502 errors
- **No Temporary Storage**: PDFs were generated on-demand but not stored
- **Missing Download Mechanism**: No way to retrieve previously generated PDFs

### New Solution:
- **Automatic PDF Generation**: PDFs are generated immediately after analysis completion
- **Disk Storage**: PDFs are saved to a dedicated directory (`generated_pdfs/`)
- **Download Endpoints**: New API endpoints to list and download stored PDFs
- **Registry System**: JSON-based registry tracks all generated PDFs

## 🚀 New Features

### 1. Automatic PDF Generation
- PDFs are automatically generated when an investigation analysis is completed
- Works for Murder Agent and Financial Agent investigations
- No manual intervention required

### 2. PDF Storage System
- PDFs are saved to `generated_pdfs/` directory
- Unique filenames prevent conflicts
- File metadata stored in `data/saved-reports.json`

### 3. New API Endpoints

#### List Saved Reports
```
GET /api/list-saved-reports
```
Returns a list of all saved PDF reports with metadata.

#### Download Stored PDF
```
GET /api/download-stored-pdf/<report_id>
```
Downloads a specific PDF by its report ID.

#### Updated Configuration
```
GET /api/config
```
Now includes information about PDF storage features.

### 4. Automatic Cleanup
- Old PDFs (7+ days) are automatically cleaned up on server startup
- Prevents disk space issues

## 📁 Directory Structure

```
AiJusticeGrid/
├── generated_pdfs/          # New PDF storage directory
│   ├── murder_Murder_Investigation_Report_20250103_143022.pdf
│   ├── finance_Finance_Investigation_Report_20250103_143155.pdf
│   └── ...
├── data/
│   ├── saved-reports.json   # Updated registry with file paths
│   └── agent-settings.json
├── unified_server.py        # Updated with new functionality
├── test_pdf_storage.py      # Test script
├── frontend_pdf_example.html # Frontend example
└── PDF_STORAGE_README.md    # This file
```

## 🔄 How It Works

### 1. Investigation Process
1. User starts an investigation (Murder or Finance)
2. User provides case information through the chat interface
3. AI agent analyzes the case and provides comprehensive analysis
4. **NEW**: PDF is automatically generated and saved to disk
5. **NEW**: Report metadata is stored in the registry

### 2. PDF Download Process
1. Frontend calls `/api/list-saved-reports` to get available PDFs
2. User selects a PDF to download
3. Frontend calls `/api/download-stored-pdf/<report_id>`
4. PDF is served directly from disk (no regeneration needed)

## 🛠️ Technical Implementation

### Backend Changes (unified_server.py)

#### New Functions:
- `save_pdf_to_disk()`: Saves PDF buffer to disk and updates registry
- `update_saved_reports_registry()`: Manages the PDF registry
- `cleanup_old_pdfs()`: Removes old PDF files

#### New Endpoints:
- `/api/download-stored-pdf/<report_id>`: Download specific PDF
- `/api/list-saved-reports`: List all saved PDFs

#### Modified Analysis Completion:
- Murder Agent: Auto-generates PDF after analysis completion
- Financial Agent: Auto-generates PDF after analysis completion

### Registry Format (saved-reports.json)
```json
[
  {
    "id": "RPT-1748967103108",
    "title": "Murder Investigation Report",
    "agentType": "murder",
    "caseId": "TN-090",
    "filename": "murder_Murder_Investigation_Report_20250103_143022.pdf",
    "filePath": "/path/to/generated_pdfs/murder_Murder_Investigation_Report_20250103_143022.pdf",
    "createdDate": "2025-01-03T14:30:22.108Z",
    "savedDate": "2025-01-03T14:30:25.445Z",
    "fileSize": 1815,
    "status": "saved",
    "description": "PDF report generated from murder agent conversation"
  }
]
```

## 🧪 Testing

### Automated Testing
Run the test script to verify functionality:
```bash
python test_pdf_storage.py
```

### Manual Testing
1. Open `frontend_pdf_example.html` in a browser
2. Update the `BACKEND_URL` if needed
3. Start an investigation using the test buttons
4. Complete the investigation in your main app
5. Refresh the reports list to see the new PDF
6. Download the PDF using the download button

### Frontend Integration Example
```javascript
// List saved reports
const response = await fetch('/api/list-saved-reports');
const data = await response.json();
const reports = data.reports;

// Download a specific PDF
const downloadResponse = await fetch(`/api/download-stored-pdf/${reportId}`);
const blob = await downloadResponse.blob();
// Create download link...
```

## 🔧 Configuration

### Environment Variables
- `PDF_DOWNLOAD_ENABLED`: Enable/disable PDF functionality (default: true)
- `PDF_MAX_SIZE_MB`: Maximum PDF size in MB (default: 10)

### Server Configuration
The server automatically:
- Creates the `generated_pdfs/` directory on startup
- Runs initial cleanup of old PDFs
- Logs PDF generation and storage activities

## 🚨 Error Handling

### PDF Generation Errors
- If PDF generation fails, the investigation continues normally
- Error is logged but doesn't affect the analysis response
- User can still access the text analysis

### Download Errors
- 404: Report ID not found
- 404: PDF file not found on disk
- 413: PDF size exceeds maximum limit
- 500: Server error during download

## 🔄 Migration from Old System

### For Existing Deployments
1. Update `unified_server.py` with the new code
2. The `generated_pdfs/` directory will be created automatically
3. Existing functionality remains unchanged
4. New PDFs will be automatically stored going forward

### For Frontend Applications
1. Update frontend to use new endpoints:
   - Replace direct PDF generation calls with stored PDF downloads
   - Add UI to list and select from saved reports
2. Use the provided `frontend_pdf_example.html` as a reference

## 📊 Benefits

### Performance
- **Faster Downloads**: PDFs served from disk instead of regenerated
- **Reduced Server Load**: No repeated PDF generation for same report
- **Better User Experience**: Immediate downloads without waiting

### Reliability
- **No 502 Errors**: PDFs are pre-generated and stored
- **Offline Capability**: PDFs available even if AI service is down
- **Backup**: PDFs persist on disk for future access

### Scalability
- **Automatic Cleanup**: Prevents disk space issues
- **Efficient Storage**: Only successful analyses generate PDFs
- **Registry System**: Fast lookup without filesystem scanning

## 🔮 Future Enhancements

### Planned Features
- PDF versioning for updated analyses
- Bulk PDF download (ZIP archives)
- PDF search and filtering
- Email delivery of PDFs
- Cloud storage integration (S3, etc.)

### Configuration Options
- Configurable cleanup intervals
- Custom PDF templates per agent
- Compression options for large PDFs
- Encryption for sensitive reports

## 🆘 Troubleshooting

### Common Issues

#### PDFs Not Being Generated
1. Check if analysis completes successfully
2. Verify `generated_pdfs/` directory exists and is writable
3. Check server logs for PDF generation errors

#### Download Failures
1. Verify report ID exists in `/api/list-saved-reports`
2. Check if PDF file exists on disk
3. Ensure PDF size is within limits

#### 502 Errors (Should be fixed)
1. Use stored PDF download instead of on-demand generation
2. Check if PDF was generated during analysis
3. Verify new endpoints are being used

### Debug Commands
```bash
# Check PDF directory
ls -la generated_pdfs/

# Check registry
cat data/saved-reports.json | jq .

# Test endpoints
curl http://localhost:5000/api/list-saved-reports
curl http://localhost:5000/api/config
```

## 📞 Support

If you encounter issues with the PDF storage system:
1. Check the server logs for detailed error messages
2. Run the test script to verify functionality
3. Use the frontend example to test integration
4. Ensure all new endpoints are properly configured in your deployment

The new system is designed to be backward-compatible while providing enhanced reliability and performance for PDF operations.
