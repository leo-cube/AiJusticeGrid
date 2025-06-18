# Theft Agent

This folder contains the Theft Investigation Agent implementation.

## 📁 Files in this folder

- **`theft_agent_main.py`** - Main Theft Agent implementation
- **`THEFT_AGENT_COMPLETE_README.md`** - Complete documentation and setup guide
- **`README.md`** - This file (quick reference)

## 🚀 Quick Start

### Run the Theft Agent directly:
```bash
# Navigate to this directory
cd Agents/Agent/TheftAgent

# Run the agent
python theft_agent_main.py
```

### Available options:
```bash
# Set up API key
python theft_agent_main.py --setup

# Run with sample case
python theft_agent_main.py --sample

# Interactive mode (default)
python theft_agent_main.py
```

## 📋 Prerequisites

1. **Python 3.8+** installed
2. **NVIDIA API Key** - Get from [NVIDIA Developer Portal](https://developer.nvidia.com/)
3. **Dependencies** - Install from parent directory:
   ```bash
   cd ../
   pip install -r requirements.txt
   ```

## 🔧 Environment Setup

Create a `.env` file in the parent `Agent` directory:
```bash
cd ../
echo "NVIDIA_API_KEY=your_api_key_here" > .env
```

## 📖 Full Documentation

For complete setup instructions, API documentation, and system architecture details, see:
**[THEFT_AGENT_COMPLETE_README.md](./THEFT_AGENT_COMPLETE_README.md)**

## 🎯 Features

- **AI-Powered Analysis** using NVIDIA Llama-3.1-Nemotron-Ultra-253B
- **Interactive Case Collection** with structured data input
- **Professional Analysis Reports** with investigative recommendations
- **Case Data Export** to text files for documentation
- **Sample Case Analysis** for demonstration

## 🔍 Agent Capabilities

The Theft Agent specializes in:
- Burglary and break-in investigations
- Shoplifting and retail theft analysis
- Vehicle theft investigations
- Identity theft detection
- Cybercrime and digital theft
- Property crime pattern analysis
- Evidence collection and analysis
- Suspect profiling and behavior analysis

## 📊 Investigation Process

The agent follows a structured 14-step conversation flow:
1. Case identification and basic details
2. Location and time analysis
3. Victim information collection
4. Stolen items documentation
5. Witness statements
6. Security system analysis
7. Evidence collection
8. Suspect information
9. Method of operation analysis
10. Access point examination
11. Timeline reconstruction
12. Pattern recognition
13. Risk assessment
14. Final analysis and recommendations

---

**Part of the AI Justice Grid Investigation System**
