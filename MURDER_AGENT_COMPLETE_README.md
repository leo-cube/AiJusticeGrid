# Murder Agent - Complete System Documentation

## 🔍 **Overview**

The Murder Agent is a comprehensive AI-powered investigation platform designed to assist law enforcement professionals in homicide investigations. Built with NVIDIA's advanced Llama-3.1-Nemotron-Ultra-253B model, it provides structured data collection, intelligent analysis, and persistent case management.

## 🏗️ **System Architecture**

### **Core Components**
- **Murder Agent Main** (`murder_agent_main.py`) - Primary AI interface
- **Backend Server** (`murder_agent_backend.py`) - Conversation flow management
- **Unified Server** (`unified_server.py`) - Central API gateway
- **Data Storage System** (`murder_data_storage.py`) - Persistent investigation storage
- **Frontend Integration** (Next.js) - User interface and API endpoints

### **Technology Stack**
- **AI Model**: NVIDIA Llama-3.1-Nemotron-Ultra-253B (253B parameters)
- **Backend**: Python with Flask
- **Frontend**: Next.js with TypeScript
- **Storage**: JSON-based persistent storage
- **API**: RESTful endpoints with comprehensive error handling

## 🆕 **Key Features**

### **✅ Core Functionality**
- **Structured Data Collection**: 14-step conversation flow for comprehensive case information
- **AI-Powered Analysis**: Advanced forensic insights and investigative recommendations
- **Persistent Storage**: Automatic data preservation for all investigations
- **PDF Report Generation**: Professional investigation reports
- **Session Management**: UUID-based session tracking with state persistence
- **Real-time Processing**: Live backend integration with immediate responses

### **🔄 Investigation Process Flow**

```
1. Case Initialization → 2. Data Collection → 3. AI Analysis → 4. Report Generation → 5. Data Storage
     ↓                      ↓                   ↓               ↓                    ↓
Session Created      14-Step Q&A Flow    NVIDIA AI Model   PDF Generation    Persistent JSON
```

## 📊 **Data Collection Structure**

The Murder Agent collects information through a structured 14-step process:

### **Case Information**
1. **Case ID** - Unique investigation identifier
2. **Date of Crime** - When the incident occurred
3. **Time of Crime** - Specific timing or timeframe
4. **Location** - Crime scene location details

### **Victim Information**
5. **Victim Name** - Victim identification
6. **Victim Age** - Age information
7. **Victim Gender** - Gender details

### **Crime Details**
8. **Cause of Death** - How the victim died
9. **Weapon Used** - Type of weapon involved
10. **Crime Scene Description** - Detailed scene analysis

### **Investigation Data**
11. **Witnesses** - Witness information and statements
12. **Evidence Found** - Physical evidence collected
13. **Suspects** - Potential suspects identified
14. **Additional Notes** - Extra relevant information

## 🔧 **API Endpoints**

### **Core Murder Agent Endpoints**
```
POST /api/augment/murder           # Main conversation endpoint
POST /api/murder-agent/direct      # Direct backend communication
GET  /api/murder-agent/init        # Initialize Murder Agent backend
```

### **Data Storage Endpoints**
```
GET /api/murder-investigations              # Retrieve all stored cases
GET /api/murder-investigations/<case_id>    # Get specific case data
```

### **System Health**
```
GET /api/health/full               # Complete system status with agent details
```

## 📁 **Data Storage Structure**

All investigation data is automatically stored in structured JSON format:

```json
{
  "murder_investigations": {
    "metadata": {
      "created": "2025-01-27T23:00:00.000Z",
      "last_updated": "2025-05-27T23:47:41.625999",
      "total_cases": 2,
      "version": "1.0.0"
    },
    "cases": {
      "CASE_ID": {
        "case_metadata": {
          "case_id": "CASE_ID",
          "session_id": "session_uuid",
          "created": "timestamp",
          "status": "active"
        },
        "conversation_data": {
          "conversation_pairs": [...],
          "total_messages": 36
        },
        "case_details": {
          "victim_information": {...},
          "crime_information": {...},
          "investigation_details": {...}
        },
        "ai_analysis": {
          "generated": true,
          "content": "Comprehensive AI analysis..."
        }
      }
    }
  }
}
```

## 🚀 **Getting Started**

### **Prerequisites**
- Python 3.8+
- Node.js 16+
- NVIDIA API Key

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd investigation-main
```

2. **Backend Setup**
```bash
cd Agents/Agent
pip install -r requirements.txt
```

3. **Environment Configuration**
```bash
# Create .env file with NVIDIA API key
echo "NVIDIA_API_KEY=your_api_key_here" > .env
```

4. **Start Backend Server**
```bash
python unified_server.py
```

5. **Frontend Setup**
```bash
cd ../../
npm install
npm run dev
```

### **Usage**

1. **Access the application** at `http://localhost:3000`
2. **Click "Talk to Agent"** to start a new investigation
3. **Follow the 14-step conversation flow** to provide case details
4. **Receive AI-powered analysis** with investigative recommendations
5. **Generate PDF reports** for official documentation
6. **Access stored data** via API endpoints for case management

## 🔍 **API Usage Examples**

### **Starting a New Investigation**
```javascript
// Frontend initiates conversation
const response = await fetch('/api/murder-agent/direct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "001", // Case ID
    context: { /* case context */ }
  })
});
```

### **Retrieving Stored Cases**
```bash
# Get all investigations
curl http://localhost:5000/api/murder-investigations

# Get specific case
curl http://localhost:5000/api/murder-investigations/001
```

## 🛡️ **Error Handling & Reliability**

### **Robust Fallback Systems**
- **Multiple API Key Sources**: Environment variables, .env file, and default fallback
- **Storage Resilience**: Analysis continues even if storage fails
- **Session Recovery**: Ability to resume interrupted conversations
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

### **Data Integrity**
- **Automatic Backups**: JSON storage with timestamp tracking
- **Validation**: Input validation at each conversation step
- **Consistency Checks**: Data structure validation before storage

## 📈 **System Benefits**

### **For Investigators**
- **Complete Case History**: Never lose investigation data
- **AI-Powered Insights**: Advanced forensic analysis and recommendations
- **Professional Reports**: PDF generation for official documentation
- **Pattern Recognition**: Compare similar cases over time

### **For Developers**
- **RESTful API**: Easy integration with existing systems
- **Structured Data**: JSON format for easy parsing and analysis
- **Extensible Architecture**: Simple to add new features and data fields
- **Comprehensive Documentation**: Well-documented codebase

### **For System Administrators**
- **Monitoring Capabilities**: Track system usage and case volume
- **Simple Backup Strategy**: JSON file-based storage
- **Complete Audit Trail**: Full investigation history
- **Health Monitoring**: System status endpoints

## 🔧 **Technical Implementation**

### **AI Model Integration**
```python
class MurderAgent:
    def __init__(self, api_key):
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
```

### **Automatic Data Storage**
```python
# Triggered automatically on analysis completion
murder_storage.store_investigation_data(
    case_id=case_id,
    session_id=session_id,
    extracted_data=collected_data,
    conversation_pairs=conversation_pairs,
    ai_analysis=analysis,
    user_metadata=user_metadata
)
```

## 📋 **File Structure**

```
investigation-main/
├── Agents/Agent/
│   ├── murder_agent_main.py          # Main AI interface
│   ├── murder_agent_backend.py       # Conversation flow management
│   ├── unified_server.py             # Central API gateway
│   ├── murder_data_storage.py        # Data storage system
│   ├── murder_investigation.json     # Persistent storage file
│   └── requirements.txt              # Python dependencies
├── src/app/api/
│   ├── murder-agent/                 # Next.js API routes
│   └── augment/murder/               # Core API endpoints
└── README.md                         # This documentation
```

## 🎯 **Current Status**

The Murder Agent system is **production-ready** with:

- ✅ **Full AI Integration** with NVIDIA's most advanced model
- ✅ **Persistent Data Storage** for all investigations
- ✅ **Professional PDF Reports** 
- ✅ **RESTful API Access** to stored data
- ✅ **Robust Error Handling** and fallback systems
- ✅ **Complete Frontend Integration** with Next.js
- ✅ **Session Management** with UUID tracking
- ✅ **Automatic Data Capture** on analysis completion

## 📞 **Support & Maintenance**

For technical support, system maintenance, or feature requests, refer to the development team or system administrator.

---

**Murder Agent** - Empowering law enforcement with AI-driven investigation capabilities.
