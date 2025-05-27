# Murder Investigation Data Storage System

## Overview

The Murder Investigation Data Storage System is a comprehensive solution for automatically capturing, storing, and retrieving Murder Agent conversation data and AI-generated analysis reports. This system provides persistent storage for all Murder Agent investigations while maintaining full compatibility with existing functionality.

## Features

### 🔍 **Automatic Data Capture**
- **Complete Conversation History**: Captures all question-answer pairs from Murder Agent chat sessions
- **Structured Data Extraction**: Automatically extracts case details (victim info, crime details, evidence, etc.)
- **AI Analysis Storage**: Stores comprehensive AI-generated case analysis reports
- **Session Metadata**: Preserves timestamps, session IDs, and user information

### 💾 **Persistent Storage**
- **JSON-Based Storage**: Uses `murder_investigation.json` for reliable data persistence
- **Structured Organization**: Clear hierarchical data structure for easy access
- **Metadata Tracking**: Automatic tracking of case counts, creation dates, and updates
- **Backup-Friendly**: Human-readable JSON format for easy backup and migration

### 🔗 **Seamless Integration**
- **Non-Intrusive**: Does not modify existing functionality
- **Automatic Triggers**: Saves data when conversations complete or PDFs are generated
- **Multiple Entry Points**: Works with both web interface and direct API calls
- **Error Resilient**: Continues normal operation even if storage fails

## File Structure

```
investigation-main/Agents/Agent/
├── murder_investigation.json          # Main storage file
├── murder_data_storage.py            # Storage module
├── test_murder_storage.py            # Test script
├── unified_server.py                 # Modified with storage integration
├── murder_agent_backend.py           # Modified with storage integration
└── MURDER_STORAGE_README.md          # This documentation
```

## Data Structure

### JSON Storage Format

```json
{
  "murder_investigations": {
    "metadata": {
      "created": "2025-01-27T23:00:00.000Z",
      "last_updated": "2025-01-27T23:00:00.000Z",
      "total_cases": 1,
      "version": "1.0.0",
      "description": "Persistent storage for Murder Agent investigation data"
    },
    "cases": {
      "CASE_001": {
        "case_metadata": {
          "case_id": "CASE_001",
          "session_id": "session_123",
          "created": "2025-01-27T23:00:00.000Z",
          "last_updated": "2025-01-27T23:00:00.000Z",
          "status": "active"
        },
        "conversation_data": {
          "total_messages": 20,
          "user_messages": 10,
          "assistant_messages": 10,
          "conversation_start": "2025-01-27T22:30:00.000Z",
          "conversation_end": "2025-01-27T23:00:00.000Z",
          "conversation_pairs": [
            {
              "question": "What is the Case ID for this investigation?",
              "answer": "CASE_001",
              "timestamp": "2025-01-27T22:30:00.000Z"
            }
          ]
        },
        "case_details": {
          "victim_information": {
            "name": "John Doe",
            "age": "35",
            "gender": "male"
          },
          "crime_information": {
            "date": "2024-01-15",
            "time": "14:30",
            "location": "123 Main Street",
            "weapon_used": "knife",
            "cause_of_death": "stab wounds"
          },
          "investigation_details": {
            "witnesses": "none",
            "evidence": "fingerprints on weapon",
            "suspects": "unknown",
            "crime_scene_description": "apartment living room"
          },
          "additional_information": {
            "notes": "door was unlocked"
          }
        },
        "ai_analysis": {
          "generated": true,
          "generated_at": "2025-01-27T23:00:00.000Z",
          "content": "**Comprehensive Analysis of Case CASE_001**\n\n..."
        },
        "user_metadata": {
          "request_id": "req_123",
          "user_id": "user_456",
          "pdf_generated": true
        },
        "raw_extracted_data": {
          // Original extracted data for reference
        }
      }
    }
  }
}
```

## Integration Points

### 1. **PDF Generation Trigger**
- **Location**: `unified_server.py` - `/api/generate-pdf` endpoint
- **Trigger**: When a Murder Agent PDF is requested
- **Action**: Automatically stores conversation data and AI analysis

### 2. **Conversation Completion Trigger**
- **Location**: `murder_agent_backend.py` - Analysis step completion
- **Trigger**: When Murder Agent completes case analysis
- **Action**: Stores complete conversation and analysis results

### 3. **API Endpoints**
- **GET** `/api/murder-investigations` - Retrieve all stored cases
- **GET** `/api/murder-investigations/<case_id>` - Retrieve specific case

## Usage Examples

### Accessing Stored Data via API

```bash
# Get all murder investigations
curl http://localhost:5000/api/murder-investigations

# Get specific case
curl http://localhost:5000/api/murder-investigations/CASE_001
```

### Programmatic Access

```python
from murder_data_storage import murder_storage

# Get all cases
all_cases = murder_storage.get_all_cases()

# Get specific case
case_data = murder_storage.get_case_data("CASE_001")

# Get metadata
metadata = murder_storage.get_storage_metadata()
```

## Benefits

### 🎯 **For Investigators**
- **Case History**: Complete record of all investigations
- **Analysis Archive**: Searchable AI analysis reports
- **Data Continuity**: Never lose investigation data
- **Pattern Recognition**: Compare similar cases over time

### 🔧 **For Developers**
- **API Access**: RESTful endpoints for data integration
- **Structured Format**: Easy to parse and analyze
- **Extensible**: Simple to add new data fields
- **Maintainable**: Clean separation of concerns

### 📊 **For System Administrators**
- **Monitoring**: Track system usage and case volume
- **Backup**: Simple JSON file backup strategy
- **Debugging**: Complete audit trail of investigations
- **Reporting**: Generate statistics and reports

## Technical Implementation

### Storage Module (`murder_data_storage.py`)
- **MurderInvestigationStorage**: Main storage class
- **Automatic File Management**: Creates and maintains JSON structure
- **Error Handling**: Graceful degradation on storage failures
- **Data Validation**: Ensures data integrity

### Integration Modifications
- **unified_server.py**: Added storage calls to PDF generation
- **murder_agent_backend.py**: Added storage calls to analysis completion
- **Non-Breaking Changes**: All existing functionality preserved

## Testing

Run the test script to verify system functionality:

```bash
cd investigation-main/Agents/Agent
python test_murder_storage.py
```

The test script validates:
- ✅ Data storage functionality
- ✅ Data retrieval operations
- ✅ AI analysis updates
- ✅ Metadata management
- ✅ Error handling

## Maintenance

### Regular Tasks
1. **Backup**: Regularly backup `murder_investigation.json`
2. **Monitoring**: Check storage file size and performance
3. **Cleanup**: Archive old cases if needed
4. **Updates**: Keep storage module updated

### Troubleshooting
- **Storage Failures**: Check file permissions and disk space
- **Import Errors**: Verify `murder_data_storage.py` is accessible
- **Data Corruption**: Restore from backup and validate JSON format

## Future Enhancements

### Planned Features
- **Database Backend**: Optional database storage for large deployments
- **Search Functionality**: Full-text search across cases and analyses
- **Export Options**: Export to various formats (CSV, Excel, etc.)
- **Data Analytics**: Built-in reporting and analytics dashboard
- **Case Linking**: Connect related cases and investigations

---

**Note**: This system is designed to be completely non-intrusive. All existing Murder Agent functionality continues to work exactly as before, with the added benefit of automatic data persistence.
