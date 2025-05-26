# Dynamic PDF Generation with NVIDIA AI Integration

This system provides dynamic PDF generation from chat conversations, creating professional investigation reports in the exact format of case analysis documents. The PDFs contain only the essential case details and AI-powered analysis.

## Features

### 🚀 Core Capabilities
- **Investigation Format**: Generates PDFs in the exact format of professional case analysis reports
- **Case Details Section**: Structured presentation of case information (Case ID, Date, Location, etc.)
- **AI Analysis Section**: NVIDIA API-powered comprehensive investigation analysis
- **Chat Data Extraction**: Automatically extracts case data from chat conversations
- **Professional Layout**: Clean, investigation-standard formatting matching sample case analysis

### 📊 Analysis Types Supported
- **General**: Expert analysis with actionable insights
- **Investigation**: Professional investigative analysis with leads and recommendations
- **Murder**: Specialized murder investigation analysis with motive and suspect analysis
- **Theft**: Theft investigation with recovery methods and recommendations
- **Fraud**: Financial fraud analysis with risk assessments
- **Business**: Strategic business insights and recommendations
- **Financial**: Financial analysis with risk assessments
- **Legal**: Legal implications and risk analysis
- **Medical**: Medical insights and recommendations
- **Technical**: Technical assessments and recommendations

## Quick Start

### 1. Install Dependencies
```bash
pip install reportlab requests
```

### 2. Set Up NVIDIA API Key (Optional)
For AI-powered analysis, set your NVIDIA API key:
```bash
export NVIDIA_API_KEY="your-nvidia-api-key-here"
```

### 3. Test the System
```bash
python test_direct_pdf.py
```

## Usage

### From Chat Interface

1. **Start a conversation** with any agent (Murder, Theft, Fraud, etc.)
2. **Provide case information** through the chat
3. **Click the "Generate PDF Report" button** in the chat header
4. **Download the generated PDF** with AI analysis

### Programmatic Usage

```python
from dynamic_pdf_generator import DynamicPDFGenerator

# Initialize with NVIDIA API key
pdf_generator = DynamicPDFGenerator('your-nvidia-api-key')

# Sample data
data = {
    'case_id': '001',
    'date': '2023-10-15',
    'location': '789 Elm Street',
    'victim_name': 'John Doe',
    'suspects': 'Ex-wife, business partner'
}

# Generate PDF
pdf_buffer = pdf_generator.generate_pdf(
    data=data,
    title='Investigation Report',
    analysis_type='murder',
    include_ai_analysis=True
)

# Save to file
with open('report.pdf', 'wb') as f:
    f.write(pdf_buffer.getvalue())
```

### API Endpoint Usage

```bash
curl -X POST http://localhost:5000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Investigation Report",
    "analysisType": "murder",
    "data": {
      "case_id": "001",
      "victim_name": "John Doe"
    },
    "messages": [
      {"sender": "user", "content": "Case ID: 001"},
      {"sender": "user", "content": "Victim: John Doe"}
    ],
    "includeAIAnalysis": true
  }' \
  --output report.pdf
```

## Data Extraction

The system automatically extracts structured data from chat messages:

### Supported Patterns
- **Case ID**: `case id: 001` → `case_id: "001"`
- **Dates**: `2023-10-15` or `10/15/2023` → `date: "2023-10-15"`
- **Time**: `23:30` → `time: "23:30"`
- **Location**: `location: 789 Elm Street` → `location: "789 Elm Street"`
- **Names**: `name: John Doe` → `name: "John Doe"`
- **Age**: `age: 42` or `42 years old` → `age: "42"`

### Conversation Metadata
- Total message count
- User vs assistant message counts
- Conversation timestamps
- Raw message content for reference

## PDF Structure

Generated PDFs follow the exact format of professional case analysis reports:

### 1. CASE DETAILS Section
```
CASE DETAILS:
==================================================
Case Id: SAMPLE-001
Date Of Crime: 2023-10-15
Time Of Crime: 23:30
Location: 789 Elm Street, Apartment 3C
Victim Name: Robert Johnson
Victim Age: 42
Victim Gender: Male
Cause Of Death: Multiple stab wounds to the chest
Weapon Used: Kitchen knife
Crime Scene Description: [Details]
Witnesses: [Witness information]
Evidence Found: [Evidence list]
Suspects: [Suspect information]
Additional Notes: [Additional information]
```

### 2. ANALYSIS Section
```
ANALYSIS:
==================================================
**Comprehensive Analysis of Case [CASE_ID]**

**1. Comprehensive Analysis of the Case**
[Detailed analysis of the case]

**2. Potential Motives and Suspects to Consider**
[Suspect analysis with motives and opportunities]

**3. Recommended Investigative Approaches**
[Specific investigative steps and procedures]

**4. Key Evidence to Focus On and How to Analyze It**
[Evidence analysis recommendations]

**5. Possible Solutions or Conclusions**
[Conclusions and next steps]
```

## Configuration

### Environment Variables
```bash
# Required for AI analysis
NVIDIA_API_KEY=your-nvidia-api-key

# Optional: Custom API endpoint
NVIDIA_API_BASE_URL=https://integrate.api.nvidia.com/v1

# Optional: Python backend URL for Next.js integration
PYTHON_BACKEND_URL=http://localhost:5000
```

### Customization Options
- **Analysis Types**: Add custom analysis types in `system_prompts`
- **PDF Styling**: Modify styles in `create_styles()` method
- **Data Extraction**: Enhance patterns in `extract_data_from_chat_messages()`
- **AI Prompts**: Customize system prompts for different analysis types

## Integration

### Next.js Frontend
The system integrates with the Next.js chat interface through:
- `PDFGenerationButton.tsx` component
- `/api/generate-pdf` API route
- Automatic data extraction from chat messages

### Python Backend
- `unified_server.py` provides the API endpoint
- `dynamic_pdf_generator.py` handles PDF creation
- `extract_data_from_chat_messages()` processes chat data

## Testing

### Run All Tests
```bash
python test_direct_pdf.py
```

### Test Specific Features
```bash
# Test basic PDF generation
python -c "from test_direct_pdf import test_direct_pdf_generation; test_direct_pdf_generation()"

# Test chat data extraction
python -c "from test_direct_pdf import test_chat_data_extraction; test_chat_data_extraction()"
```

## Troubleshooting

### Common Issues

1. **ReportLab Import Error**
   ```bash
   pip install reportlab
   ```

2. **NVIDIA API Error**
   - Verify API key is correct
   - Check network connectivity
   - Ensure sufficient API credits

3. **Server Connection Error**
   - Start the unified server: `python unified_server.py`
   - Check port 5000 is available
   - Verify firewall settings

4. **PDF Generation Fails**
   - Check file permissions
   - Ensure sufficient disk space
   - Verify data format is correct

### Debug Mode
Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Examples

### Murder Investigation Report
```python
murder_data = {
    'case_id': '001',
    'victim_name': 'Robert Johnson',
    'cause_of_death': 'Multiple stab wounds',
    'suspects': 'Ex-wife, business partner',
    'evidence': 'Bloody knife, fingerprints'
}

pdf_buffer = pdf_generator.generate_pdf(
    data=murder_data,
    title='Murder Investigation Report',
    analysis_type='murder',
    include_ai_analysis=True
)
```

### Financial Fraud Analysis
```python
fraud_data = {
    'case_id': 'FR-2023-001',
    'amount_involved': '$50,000',
    'suspect_name': 'John Smith',
    'victim_company': 'ABC Corp',
    'fraud_type': 'Embezzlement'
}

pdf_buffer = pdf_generator.generate_pdf(
    data=fraud_data,
    title='Financial Fraud Investigation',
    analysis_type='fraud',
    include_ai_analysis=True
)
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the test files for examples
3. Examine the generated log files
4. Verify all dependencies are installed

## License

This system is part of the AI Justice Grid Investigation System.
