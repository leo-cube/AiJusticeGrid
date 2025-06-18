# Murder Agent for NVIDIA Llama-3.1-Nemotron-Ultra-253B

A specialized AI agent for analyzing and solving murder cases, built on NVIDIA's Llama-3.1-Nemotron-Ultra-253B model.

## Overview

The Murder Agent is a fine-tuned version of NVIDIA's Llama-3.1-Nemotron-Ultra-253B model, specifically trained on homicide and crime datasets to provide expert analysis and solutions for murder cases. This agent can help law enforcement professionals, investigators, and crime analysts by:

- Analyzing case details and providing comprehensive insights
- Identifying potential motives and suspects
- Recommending investigative approaches
- Highlighting key evidence to look for
- Suggesting possible solutions or conclusions

## Features

- **Data-Driven Analysis**: Trained on extensive homicide datasets to provide insights based solely on user-provided data
- **Interactive Interface**: User-friendly command-line interface for inputting case details and receiving analysis
- **Comprehensive Reporting**: Detailed analysis reports that can be saved for future reference

## Installation

1. Install the required dependencies:
   ```
   pip install openai
   ```

2. Obtain an API key from NVIDIA for accessing the Llama-3.1-Nemotron-Ultra-253B model.

## Usage

### Setting Up Your API Key

You can provide your NVIDIA API key in two ways:

1. **Using a .env file (recommended)**:
   ```
   python murder_agent_main.py --setup
   ```
   This will store your API key in a .env file, which will be automatically used.

2. **Providing the API key directly**:
   ```
   python murder_agent_main.py --api_key YOUR_API_KEY
   ```

### Using the Murder Agent

To interact with the Murder Agent:

```
python murder_agent_main.py
```

This will start an interactive session where you can input case details and receive analysis.

### Analyzing a Sample Case

To analyze a sample case to see how the Murder Agent works:

```
python murder_agent_main.py --sample
```

This will analyze a pre-defined sample case and save the analysis to a file.

## Datasets

The Murder Agent is trained on the following datasets:

1. **Crime Data from 2020 to Present**
2. **Crime Dataset India**
3. **Homicide Country Data**
4. **Other murder datasets in the "murder datasets" directory**

## Model Details

- **Base Model**: NVIDIA Llama-3.1-Nemotron-Ultra-253B
- **Parameters**: 253 billion
- **Training Focus**: Murder case analysis, investigative techniques, forensic insights
- **Specialization**: Homicide investigation, crime scene analysis, motive determination

## File Structure

```
murder-agent/
├── murder_agent_main.py      # Main file for the Murder Agent
├── murder datasets/          # Directory containing murder datasets
│   ├── Crime_Data_from_2020_to_Present (1).csv
│   ├── crime_dataset_india.csv
│   ├── database.csv
│   └── homicide_country_download.xlsx
├── .env                      # Environment file for storing API key
└── README.md                 # This file
```

## Example Case Input

When using the Murder Agent, you'll be prompted to enter the following details:

- **Case ID**: Identifier for the case
- **Date of Crime**: When the crime occurred
- **Time of Crime**: The time when the crime occurred
- **Location**: Where the crime took place
- **Victim Name**: Name of the victim
- **Victim Age**: Age of the victim
- **Victim Gender**: Gender of the victim
- **Cause of Death**: How the victim died
- **Weapon Used**: The weapon or method used
- **Crime Scene Description**: Details about the crime scene
- **Witnesses**: Information about any witnesses
- **Evidence Found**: Evidence discovered at the scene
- **Suspects**: Potential suspects
- **Additional Notes**: Any other relevant information

## Limitations

- The Murder Agent is a tool to assist human investigators, not replace them
- Analysis is based on the data provided and may not account for all real-world factors
- The agent should be used as part of a broader investigative process
- All recommendations should be verified by human experts

## Acknowledgements

- NVIDIA for providing the Llama-3.1-Nemotron-Ultra-253B model
