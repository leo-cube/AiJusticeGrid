# Investigation Agents Backend System

A comprehensive Python backend system for police investigations, featuring specialized AI agents for different crime types. This system provides powerful investigation tools for law enforcement officers to analyze cases, detect patterns, and generate detailed reports.

## API Key Configuration

Set your NVIDIA API key in a `.env` file:
```
NVIDIA_API_KEY=your_nvidia_api_key_here
```

## AI Agents

This system features specialized AI agents powered by NVIDIA's Llama-3.1-Nemotron-Ultra-253B model:

- **Murder Agent**: Expert in homicide investigations and crime scene analysis
- **Financial Fraud Agent**: Specialized in detecting financial crimes and fraud patterns
- **Theft Agent**: Focused on property crime analysis and theft investigations

## Features

- **Unified Server**: Single backend server managing all investigation agents
- **Case Management**: Persistent storage for investigation data and analysis
- **PDF Report Generation**: Automated generation of detailed investigation reports
- **Data Storage**: JSON-based case storage with comprehensive metadata
- **AI Analysis**: Advanced AI-powered case analysis and recommendations
- **RESTful API**: Clean API endpoints for agent interactions

## Technologies Used

- **Backend**: Python, Flask
- **AI Model**: NVIDIA Llama-3.1-Nemotron-Ultra-253B
- **PDF Generation**: ReportLab
- **Data Storage**: JSON files with structured schemas
- **API Client**: OpenAI-compatible client for NVIDIA API

## Getting Started

1. **Install Dependencies**:
   ```bash
   cd Agent
   pip install -r requirements.txt
   ```

2. **Set up API Key**:
   Create a `.env` file with your NVIDIA API key:
   ```
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```

3. **Run the Unified Server**:
   ```bash
   python unified_server.py
   ```

4. **Access the API**:
   The server runs on `http://localhost:5000` with endpoints for each agent.

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

## File Structure

```
investigation-main/
├── Agent/                          # Main backend directory
│   ├── unified_server.py           # Main server file
│   ├── murder_agent_backend.py     # Murder investigation logic
│   ├── murder_data_storage.py      # Data persistence
│   ├── murder_pdf_generator.py     # PDF report generation
│   ├── FinancialAgent/            # Financial fraud agent
│   ├── TheftAgent/                 # Theft investigation agent
│   ├── templates/                  # PDF templates
│   └── requirements.txt            # Python dependencies
├── data/                           # Configuration and saved data
├── generated_reports/              # PDF output directory
└── *.json                         # Investigation data files
```

## API Endpoints

- `POST /murder` - Murder agent interactions
- `POST /finance` - Financial fraud agent interactions
- `POST /theft` - Theft agent interactions
- `GET /health` - Server health check
- `POST /reset/{agent}` - Reset agent conversation

## Data Storage

Each agent maintains persistent storage:
- **Case Data**: Structured JSON with metadata
- **Conversation History**: Complete interaction logs
- **AI Analysis**: Generated insights and recommendations
- **PDF Reports**: Downloadable investigation reports

## Limitations

- AI agents are tools to assist human investigators, not replace them
- Analysis is based on provided data and may not account for all factors
- All recommendations should be verified by human experts
- Use as part of a broader investigative process
