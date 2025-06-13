# Financial Agent

This folder contains the Financial Fraud Detection Agent implementation.

## 📁 Files in this folder

- **`financial_fraud_agent_main.py`** - Main Financial Agent implementation
- **`FINANCE_AGENT_COMPLETE_README.md`** - Complete documentation and setup guide
- **`README.md`** - This file (quick reference)

## 🚀 Quick Start

### Run the Financial Agent directly:
```bash
# Navigate to this directory
cd Agents/Agent/FinancialAgent

# Run the agent
python financial_fraud_agent_main.py
```

### Available options:
```bash
# Set up API key
python financial_fraud_agent_main.py --setup

# Run with sample case
python financial_fraud_agent_main.py --sample

# Interactive mode (default)
python financial_fraud_agent_main.py
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
**[FINANCE_AGENT_COMPLETE_README.md](./FINANCE_AGENT_COMPLETE_README.md)**

## 🎯 Features

- **AI-Powered Analysis** using NVIDIA Llama-3.3-Nemotron-Super-49B-v1
- **Interactive Case Collection** with structured data input
- **Professional Analysis Reports** with investigative recommendations
- **Case Data Export** to text files for documentation
- **Sample Case Analysis** for demonstration

## 🔍 Agent Capabilities

The Financial Agent specializes in:
- Credit card fraud analysis
- Identity theft investigations
- Wire fraud detection
- Money laundering pattern recognition
- Transaction anomaly analysis
- Forensic financial analysis
- Risk assessment and mitigation strategies

---

**Part of the AI Justice Grid Investigation System**
