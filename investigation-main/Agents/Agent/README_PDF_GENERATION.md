# PDF Generation System

This document explains the new PDF generation system for the AI Justice Grid Investigation platform.

## Overview

The PDF generation system has been redesigned to use Python-based PDF generation instead of JavaScript-based generation. This provides better formatting, more professional output, and dynamic content based on the JSON data structure you provided.

## Features

- **Dynamic PDF Generation**: Creates PDFs based on incident data with proper formatting
- **Professional Layout**: Uses ReportLab for high-quality PDF output
- **Structured Data**: Supports victims, suspects, evidence, and AI analysis sections
- **Fallback Support**: Includes a simple HTML-to-PDF fallback using weasyprint
- **Unique IDs**: Each generated report has a unique ID for tracking

## Architecture

### Backend (Python)
- `unified_server.py`: Main server with PDF generation endpoint
- `pdf_test_server.py`: Standalone test server for PDF generation
- `generate_incident_pdf()`: Core PDF generation function using ReportLab

### Frontend (Next.js)
- `/api/generate-pdf/route.ts`: API proxy to Python backend
- `DownloadReportButton.tsx`: Updated to use new PDF generation
- Automatic download handling with proper filenames

## Installation

1. Install Python dependencies:
```bash
cd Agents/Agent
pip install -r requirements.txt
```

2. For better PDF support, also install weasyprint:
```bash
pip install weasyprint
```

## Usage

### Starting the Servers

1. **Main Server** (includes all agent functionality + PDF generation):
```bash
cd Agents/Agent
python unified_server.py
```

2. **Test Server** (PDF generation only):
```bash
cd Agents/Agent
python pdf_test_server.py
```

### Testing PDF Generation

Run the test script to verify everything works:
```bash
cd Agents/Agent
python test_pdf_generation.py
```

### Using in the Application

1. Start a conversation with any crime agent
2. Complete the investigation to get an analysis
3. Click the "Download PDF Report" button
4. The PDF will be automatically generated and downloaded

## PDF Structure

The generated PDF includes:

### Header Section
- Report ID
- Generation timestamp
- Status badge

### Incident Details
- Date and time of incident
- Location
- Incident type
- Reporting officer
- Evidence summary

### Victims Section (if applicable)
- Name, age, gender
- Injury details
- Multiple victims supported

### Suspects Section (if applicable)
- Name, age, gender
- Physical description
- Multiple suspects supported

### Analysis Section
- AI-generated analysis
- Investigation insights
- Recommendations

### Footer
- Generation timestamp
- System attribution

## Data Format

The system expects incident data in this format:

```json
{
  "id": "INC-001",
  "date": "2025-01-16",
  "time": "14:30",
  "location": "Crime Scene Location",
  "incident_type": "Investigation Type",
  "description": "Incident description",
  "reporting_officer": "Officer Name",
  "evidence": "Evidence summary",
  "status": "Completed",
  "victims": [
    {
      "name": "Victim Name",
      "age": 30,
      "gender": "Gender",
      "injuries": "Injury details"
    }
  ],
  "suspects": [
    {
      "name": "Suspect Name",
      "age": 25,
      "gender": "Gender",
      "description": "Physical description"
    }
  ],
  "ai_analysis": "AI-generated analysis text"
}
```

## Troubleshooting

### Common Issues

1. **ReportLab not installed**: Install with `pip install reportlab==4.0.4`
2. **Server not running**: Make sure Python backend is started
3. **CORS errors**: Ensure flask-cors is installed and configured
4. **PDF not downloading**: Check browser download settings

### Fallback Options

If ReportLab is not available, the system will:
1. Try to use weasyprint for HTML-to-PDF conversion
2. Fall back to text-based reports if neither is available

### Environment Variables

Set these in your `.env` file:
```
PYTHON_BACKEND_URL=http://localhost:5000
```

## API Endpoints

### POST /api/generate-pdf
Generates a PDF from incident data.

**Request Body**: Incident data JSON
**Response**: PDF file download
**Content-Type**: application/pdf

## Integration with Chat System

The PDF generation is automatically triggered when:
1. A crime agent completes an analysis
2. The message contains analysis markers
3. The user clicks "Download PDF Report"

The system extracts relevant data from the chat context and AI response to populate the PDF template.

## Future Enhancements

- Custom PDF templates per incident type
- Batch PDF generation
- Email delivery of reports
- Digital signatures
- Watermarking for official reports
