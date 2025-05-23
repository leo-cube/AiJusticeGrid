# Theft Agent for NVIDIA Llama-3.3-Nemotron-Super-49B-v1

A specialized AI agent for analyzing and solving theft cases, built on NVIDIA's Llama-3.3-Nemotron-Super-49B-v1 model.

## Overview

The Theft Agent is a fine-tuned version of NVIDIA's Llama-3.3-Nemotron-Super-49B-v1 model, specifically trained on theft datasets to provide expert analysis and solutions for theft cases. This agent can help security professionals, investigators, and analysts by:

- Analyzing theft case details and providing comprehensive insights
- Identifying potential methods used by thieves
- Recommending investigative approaches
- Highlighting key evidence to focus on
- Suggesting solutions and preventive measures

## Features

- **Data-Driven Analysis**: Trained on extensive theft datasets to provide insights based solely on user-provided data
- **Interactive Interface**: User-friendly command-line interface for inputting case details and receiving analysis
- **Comprehensive Reporting**: Detailed analysis reports that can be saved for future reference

## Installation

1. Install the required dependencies:
   ```
   pip install openai
   ```

2. The API key is already included in the script.

## Usage

### Using the Theft Agent

To interact with the Theft Agent:

```
python theft_agent_main.py
```

This will start an interactive session where you can input case details and receive analysis.

### Analyzing a Sample Case

To analyze a sample case to see how the Theft Agent works:

```
python theft_agent_main.py --sample
```

This will analyze a pre-defined sample case and save the analysis to a file.

## Datasets

The Theft Agent is trained on various theft datasets, including:

1. **Shoplifting Data**
2. **Vehicle Theft Records**
3. **Burglary Reports**
4. **Retail Theft Statistics**

## Model Details

- **Base Model**: NVIDIA Llama-3.3-Nemotron-Super-49B-v1
- **Parameters**: 49 billion
- **Training Focus**: Theft case analysis, investigative techniques, security insights
- **Specialization**: Theft investigation, scene analysis, method determination

## File Structure

```
theft-agent/
├── theft_agent_main.py      # Main file for the Theft Agent
├── theft datasets/          # Directory containing theft datasets
├── .env                     # Environment file for storing API key (optional)
└── README_THEFT_AGENT.md    # This file
```

## Example Case Input

When using the Theft Agent, you'll be prompted to enter the following details:

- **Case ID**: Identifier for the case
- **Date of Theft**: When the theft occurred
- **Time of Theft**: The time when the theft occurred
- **Location**: Where the theft took place
- **Items Stolen**: Description of stolen items
- **Estimated Value**: Value of stolen items
- **Method of Entry**: How the thief gained access
- **Scene Description**: Details about the theft scene
- **Witnesses**: Information about any witnesses
- **Evidence Found**: Evidence discovered at the scene
- **Suspects**: Potential suspects
- **Security Measures**: Security systems in place
- **Additional Notes**: Any other relevant information

## Limitations

- The Theft Agent is a tool to assist human investigators, not replace them
- Analysis is based on the data provided and may not account for all real-world factors
- The agent should be used as part of a broader investigative process
- All recommendations should be verified by human experts

## Acknowledgements

- NVIDIA for providing the Llama-3.3-Nemotron-Super-49B-v1 model
