# Financial Fraud Agent for NVIDIA Llama-3.3-Nemotron-Super-49B-v1

A specialized AI agent for analyzing and solving financial fraud cases, built on NVIDIA's Llama-3.3-Nemotron-Super-49B-v1 model.

## Overview

The Financial Fraud Agent is a fine-tuned version of NVIDIA's Llama-3.3-Nemotron-Super-49B-v1 model, specifically trained on financial fraud datasets to provide expert analysis and solutions for fraud cases. This agent can help financial investigators, security professionals, and analysts by:

- Analyzing financial fraud case details and providing comprehensive insights
- Identifying potential methods and techniques used by fraudsters
- Recommending investigative approaches
- Highlighting key evidence to focus on
- Suggesting solutions, recovery strategies, and preventive measures

## Features

- **Data-Driven Analysis**: Trained on extensive financial fraud datasets to provide insights based solely on user-provided data
- **Interactive Interface**: User-friendly command-line interface for inputting case details and receiving analysis
- **Comprehensive Reporting**: Detailed analysis reports that can be saved for future reference

## Installation

1. Install the required dependencies:
   ```
   pip install openai
   ```

2. The API key is already included in the script.

## Usage

### Using the Financial Fraud Agent

To interact with the Financial Fraud Agent:

```
python financial_fraud_agent_main.py
```

This will start an interactive session where you can input case details and receive analysis.

### Analyzing a Sample Case

To analyze a sample case to see how the Financial Fraud Agent works:

```
python financial_fraud_agent_main.py --sample
```

This will analyze a pre-defined sample case and save the analysis to a file.

## Datasets

The Financial Fraud Agent is trained on various financial fraud datasets, including:

1. **Credit Card Fraud Detection Dataset**
   - Transactions labeled as fraudulent or legitimate
   - Features include time, amount, and anonymized numerical features

2. **Synthetic PaySim Mobile Money Transactions**
   - Simulated mobile money transactions with fraud labels
   - Includes transaction type, amount, origin, destination, and fraud flags

3. **Bank Account Fraud Dataset (NeurIPS 2022)**
   - Synthetic bank account datasets mimicking real-world fraud patterns
   - Multiple scenarios and fraud types represented

4. **Financial Statement Fraud Data**
   - Quarterly financial statements with fraud indicators
   - Helps identify financial ratio anomalies

5. **Healthcare Provider Fraud Detection**
   - Medicare billing data with fraudulent claims
   - Domain-specific fraud patterns

6. **Credit Card Applications Fraud**
   - Application data with fraud flags
   - Features for classification and regression experiments

## Model Details

- **Base Model**: NVIDIA Llama-3.3-Nemotron-Super-49B-v1
- **Parameters**: 49 billion
- **Training Focus**: Financial fraud analysis, investigative techniques, security insights
- **Specialization**: Fraud detection, pattern analysis, method determination

## File Structure

```
financial-fraud-agent/
├── financial_fraud_agent_main.py      # Main file for the Financial Fraud Agent
├── financial_fraud_datasets/          # Directory containing financial fraud datasets
├── .env                               # Environment file for storing API key (optional)
└── README_FINANCIAL_FRAUD_AGENT.md    # This file
```

## Example Case Input

When using the Financial Fraud Agent, you'll be prompted to enter the following details:

- **Case ID**: Identifier for the case
- **Date Detected**: When the fraud was discovered
- **Fraud Type**: Type of financial fraud (e.g., credit card, identity theft, wire fraud)
- **Amount Involved**: Value of the fraudulent transactions
- **Victim Details**: Information about the individual or organization affected
- **Transaction Details**: Specifics about the fraudulent transactions
- **Suspicious Activities**: Unusual patterns or behaviors observed
- **Account Information**: Details about the affected accounts
- **Detection Method**: How the fraud was initially detected
- **Evidence Available**: Evidence collected related to the fraud
- **Suspect Information**: Details about potential perpetrators
- **Existing Security Measures**: Security systems in place at the time
- **Previous Incidents**: History of similar fraud cases
- **Additional Notes**: Any other relevant information

## Limitations

- The Financial Fraud Agent is a tool to assist human investigators, not replace them
- Analysis is based on the data provided and may not account for all real-world factors
- The agent should be used as part of a broader investigative process
- All recommendations should be verified by human experts

## Acknowledgements

- NVIDIA for providing the Llama-3.3-Nemotron-Super-49B-v1 model
- Kaggle and other data providers for the financial fraud datasets
