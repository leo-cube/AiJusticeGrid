# AI Justice Grid - Investigation Agents Backend

A comprehensive Python backend system for police investigations, featuring specialized AI agents for different crime types. This system provides powerful investigation tools for law enforcement officers to analyze cases, detect patterns, and generate detailed reports with automatic PDF storage.

## 🚀 Quick Start

### Environment Setup
Set your NVIDIA API key in a `.env` file:
```
NVIDIA_API_KEY=your_nvidia_api_key_here
```

### Installation
```bash
pip install -r requirements.txt
```

### Run the Server
```bash
python unified_server.py
```

## 🤖 AI Agents

This system features specialized AI agents powered by NVIDIA's Llama-3.1-Nemotron-Ultra-253B model:

- **Murder Agent**: Expert in homicide investigations and crime scene analysis
- **Financial Fraud Agent**: Specialized in detecting financial crimes and fraud patterns
- **Theft Agent**: Focused on property crime analysis and theft investigations

## ✨ Key Features

- **Unified Server**: Single backend server managing all investigation agents
- **Case Management**: Persistent storage for investigation data and analysis
- **Automatic PDF Generation**: PDFs generated automatically after analysis completion
- **PDF Storage System**: Stored PDFs available for download anytime
- **Data Storage**: JSON-based case storage with comprehensive metadata
- **AI Analysis**: Advanced AI-powered case analysis and recommendations
- **RESTful API**: Clean API endpoints for agent interactions
- **CORS Support**: Ready for frontend integration

## 🛠️ Technologies Used

- **Backend**: Python, Flask
- **AI Model**: NVIDIA Llama-3.1-Nemotron-Ultra-253B
- **PDF Generation**: ReportLab, WeasyPrint
- **Data Storage**: JSON files with structured schemas
- **API Client**: OpenAI-compatible client for NVIDIA API
- **Deployment**: Gunicorn, Render.com ready

## 📋 API Endpoints

### Core Endpoints
- `POST /api/augment/murder` - Murder agent interactions
- `POST /api/augment/finance` - Financial fraud agent interactions
- `POST /api/augment/theft` - Theft agent interactions
- `GET /api/health` - Server health check

### PDF Management (New!)
- `GET /api/list-saved-reports` - List all saved PDF reports
- `GET /api/download-stored-pdf/<report_id>` - Download specific PDF
- `POST /api/download-report` - Generate PDF on-demand (legacy)
- `GET /api/config` - Server configuration

### Agent Management
- `GET /toggle-agent` - Get agent status
- `POST /toggle-agent` - Toggle agent enabled/disabled
- `POST /update-agents` - Bulk update agent statuses

## Agent Usage

### Murder Agent
- Endpoint: `/murder`
- Analyzes homicide cases through 14-question conversation flow
- Generates comprehensive investigation reports

### Financial Fraud Agent
- Endpoint: `/finance`
- Investigates financial fraud cases
- Provides detailed fraud analysis and recommendations

### Theft Agent
- Endpoint: `/theft`
- Handles property crime investigations
- Analyzes theft patterns and provides insights

## 📁 Project Structure

```
AiJusticeGrid/
├── unified_server.py               # Main server file
├── murder_agent_backend.py         # Murder investigation logic
├── murder_data_storage.py          # Data persistence
├── murder_pdf_generator.py         # Murder PDF generator
├── dynamic_pdf_generator.py        # Dynamic PDF generation
├── FinancialAgent/                 # Financial fraud agent module
│   ├── finance_agent_backend.py
│   ├── finance_data_storage.py
│   └── financial_pdf_generator.py
├── TheftAgent/                     # Theft investigation agent module
│   ├── theft_agent_main.py
│   └── theft_pdf_generator.py
├── templates/                      # PDF templates
│   └── pdf_template.html
├── data/                           # Configuration and saved data
│   ├── agent-settings.json
│   └── saved-reports.json
├── generated_pdfs/                 # Auto-generated PDF storage (created automatically)
├── requirements.txt                # Python dependencies
├── render.yaml                     # Deployment configuration
└── README.md                       # This file
```

## 💾 Data Storage

Each agent maintains persistent storage:
- **Case Data**: Structured JSON with metadata
- **Conversation History**: Complete interaction logs
- **AI Analysis**: Generated insights and recommendations
- **PDF Reports**: Automatically generated and stored for download
- **Report Registry**: JSON-based tracking of all generated PDFs

## 🔄 PDF Generation Flow

1. **User completes investigation** → AI provides comprehensive analysis
2. **PDF automatically generated** → Uses specialized PDF generators
3. **PDF saved to disk** → Stored in `generated_pdfs/` directory
4. **Registry updated** → Report metadata added to `saved-reports.json`
5. **Available for download** → Frontend can list and download PDFs anytime

## 🚀 Deployment

### Environment Variables
```bash
NVIDIA_API_KEY=your_nvidia_api_key_here
PDF_DOWNLOAD_ENABLED=true
PDF_MAX_SIZE_MB=10
FRONTEND_URL=https://your-frontend-url.com
```

### Production Deployment (Render.com)
1. Connect your GitHub repository to Render
2. Use the included `render.yaml` configuration
3. Set environment variables in Render dashboard
4. Deploy automatically

### Local Development
```bash
pip install -r requirements.txt
python unified_server.py
```

## 📝 Frontend Integration

### List Available Reports
```javascript
const response = await fetch('/api/list-saved-reports');
const reports = await response.json();
```

### Download PDF Report
```javascript
const response = await fetch(`/api/download-stored-pdf/${reportId}`);
const blob = await response.blob();
// Create download link
```

## ⚠️ Important Notes

- AI agents are tools to assist human investigators, not replace them
- Analysis is based on provided data and may not account for all factors
- All recommendations should be verified by human experts
- Use as part of a broader investigative process
- PDFs are automatically cleaned up after 7 days

## 📞 Support

For deployment issues or questions, check the server logs and ensure all environment variables are properly set.
