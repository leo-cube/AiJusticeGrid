#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Theft Agent - Main Interface

This is the main file that interacts with the NVIDIA Llama-3.3-Nemotron-Super-49B-v1 model
trained on theft datasets to provide solutions based on user-provided case data.

Usage:
    python theft_agent_main.py

Author: Augment Agent
"""

import os
import argparse
import logging
import json
import time
from typing import Dict, Any
from pathlib import Path
from openai import OpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("theft_agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
ENV_FILE = ".env"
API_KEY_VAR = "NVIDIA_API_KEY"
MODEL_NAME = "nvidia/llama-3.3-nemotron-super-49b-v1"
API_KEY = "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"

def retrieve_api_key():
    """
    Retrieve the API key from the .env file.
    
    Returns:
        API key or None if not found
    """
    try:
        # Check if .env file exists
        env_path = Path(ENV_FILE)
        if not env_path.exists():
            logger.error(f".env file not found")
            return None
        
        # Read .env file
        api_key = None
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith(f"{API_KEY_VAR}="):
                    api_key = line.strip().split('=', 1)[1]
                    break
        
        if not api_key:
            logger.error(f"API key not found in {ENV_FILE}")
            return None
        
        return api_key
    
    except Exception as e:
        logger.error(f"Error retrieving API key: {str(e)}")
        return None

def store_api_key(api_key):
    """
    Store the API key in the .env file.
    
    Args:
        api_key: The API key to store
        
    Returns:
        Boolean indicating success
    """
    try:
        # Create .env file if it doesn't exist
        env_path = Path(ENV_FILE)
        
        # Check if .env file exists and read existing content
        env_content = {}
        if env_path.exists():
            with open(env_path, 'r') as f:
                for line in f:
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        env_content[key] = value
        
        # Update or add API key
        env_content[API_KEY_VAR] = api_key
        
        # Write back to .env file
        with open(env_path, 'w') as f:
            for key, value in env_content.items():
                f.write(f"{key}={value}\n")
        
        logger.info(f"API key stored in {ENV_FILE}")
        return True
    
    except Exception as e:
        logger.error(f"Error storing API key: {str(e)}")
        return False

class TheftAgent:
    """
    Main interface for the Theft Agent that analyzes theft cases using the NVIDIA API.
    """
    
    def __init__(self, api_key):
        """
        Initialize the Theft Agent.
        
        Args:
            api_key: NVIDIA API key
        """
        self.api_key = api_key
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        logger.info(f"Theft Agent initialized with model: {MODEL_NAME}")
    
    def analyze_case(self, case_details):
        """
        Analyze a theft case using the NVIDIA model.
        
        Args:
            case_details: Dictionary containing case details
            
        Returns:
            Analysis and solutions for the case
        """
        logger.info("Analyzing theft case")
        
        # Format the case details into a prompt
        prompt = self._format_case_prompt(case_details)
        
        try:
            # Call the NVIDIA API with the real API key
            logger.info("Calling NVIDIA API for analysis")
            
            system_prompt = "You are a Theft Agent, an AI assistant specialized in analyzing and solving theft cases. Provide detailed analysis, insights, and investigative approaches based solely on the case details provided. Focus on the specific information given and avoid making assumptions beyond what's in the data."
            
            response = self.client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                top_p=0.95,
                max_tokens=4096,
                frequency_penalty=0,
                presence_penalty=0
            )
            
            analysis = response.choices[0].message.content
            logger.info("Case analysis completed (using NVIDIA API)")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing case: {str(e)}")
            return f"Error analyzing case: {str(e)}"
    
    def _format_case_prompt(self, case_details):
        """
        Format case details into a prompt for the model.
        
        Args:
            case_details: Dictionary containing case details
            
        Returns:
            Formatted prompt string
        """
        prompt = "Analyze the following theft case and provide insights and solutions based ONLY on the data provided:\n\n"
        
        for key, value in case_details.items():
            if value:
                prompt += f"{key.replace('_', ' ').title()}: {value}\n"
        
        prompt += "\n\nBased on these specific details, please provide:\n"
        prompt += "1. A comprehensive analysis of the theft case\n"
        prompt += "2. Potential methods used by the thief/thieves\n"
        prompt += "3. Recommended investigative approaches specific to this case\n"
        prompt += "4. Key evidence to focus on and how to analyze it\n"
        prompt += "5. Possible solutions or preventive measures for the future\n"
        prompt += "\nImportant: Base your analysis ONLY on the information provided in this case. Do not use generic templates or assumptions not supported by the data."
        
        return prompt
    
    def interactive_session(self):
        """
        Start an interactive session with the Theft Agent.
        """
        print("\n" + "="*50)
        print("Welcome to the Theft Agent")
        print("Enter case details to receive analysis and solutions")
        print("Type 'exit' to end the session")
        print("="*50 + "\n")
        
        while True:
            case_details = {}
            
            print("\nEnter case details (press Enter after each entry, leave blank to skip):")
            
            case_details["case_id"] = input("Case ID: ")
            if case_details["case_id"].lower() == "exit":
                break
                
            case_details["date_of_theft"] = input("Date of Theft: ")
            case_details["time_of_theft"] = input("Time of Theft: ")
            case_details["location"] = input("Location: ")
            case_details["items_stolen"] = input("Items Stolen: ")
            case_details["estimated_value"] = input("Estimated Value: ")
            case_details["method_of_entry"] = input("Method of Entry: ")
            case_details["scene_description"] = input("Scene Description: ")
            case_details["witnesses"] = input("Witnesses: ")
            case_details["evidence_found"] = input("Evidence Found: ")
            case_details["suspects"] = input("Suspects: ")
            case_details["security_measures"] = input("Security Measures in Place: ")
            case_details["additional_notes"] = input("Additional Notes: ")
            
            # Remove empty fields
            case_details = {k: v for k, v in case_details.items() if v}
            
            if not case_details:
                print("No case details provided. Please try again.")
                continue
            
            print("\nAnalyzing case...")
            analysis = self.analyze_case(case_details)
            
            print("\n" + "="*50)
            print("THEFT AGENT ANALYSIS")
            print("="*50)
            print(analysis)
            print("="*50)
            
            save_option = input("\nWould you like to save this analysis? (y/n): ")
            if save_option.lower() == 'y':
                case_id = case_details.get("case_id", f"case_{int(time.time())}")
                filename = f"theft_analysis_{case_id}.txt"
                
                with open(filename, "w") as f:
                    f.write("CASE DETAILS:\n")
                    f.write("="*50 + "\n")
                    for key, value in case_details.items():
                        f.write(f"{key.replace('_', ' ').title()}: {value}\n")
                    
                    f.write("\nANALYSIS:\n")
                    f.write("="*50 + "\n")
                    f.write(analysis)
                
                print(f"Analysis saved to {filename}")
            
            continue_option = input("\nWould you like to analyze another case? (y/n): ")
            if continue_option.lower() != 'y':
                break
        
        print("\nThank you for using the Theft Agent. Goodbye!")

def analyze_sample_case(agent):
    """
    Analyze a sample theft case to demonstrate the Theft Agent.
    
    Args:
        agent: Initialized TheftAgent instance
    """
    # Sample case details
    sample_case = {
        "case_id": "THEFT-001",
        "date_of_theft": "2023-11-20",
        "time_of_theft": "Between 14:00-16:00",
        "location": "Downtown Shopping Mall, Electronics Store",
        "items_stolen": "5 high-end smartphones, 3 laptops, and 2 tablets",
        "estimated_value": "$12,500",
        "method_of_entry": "No forced entry detected",
        "scene_description": "Store was open for business. Display cases were unlocked. Security cameras show brief power outage at 15:20 lasting 3 minutes.",
        "witnesses": "Store clerk reports being distracted by a customer asking complex questions about products in another section",
        "evidence_found": "Partial fingerprints on display case, footprints near emergency exit",
        "suspects": "Unknown individuals, possibly a group based on the quantity of items taken",
        "security_measures": "Security cameras, alarm system, locked display cases",
        "additional_notes": "Similar theft reported at another electronics store in the same mall two weeks ago"
    }
    
    print("\n" + "="*50)
    print("THEFT AGENT SAMPLE CASE")
    print("="*50 + "\n")
    
    print("Analyzing sample theft case...")
    print("\nCase Details:")
    for key, value in sample_case.items():
        print(f"{key.replace('_', ' ').title()}: {value}")
    
    # Analyze the case
    analysis = agent.analyze_case(sample_case)
    
    print("\n" + "="*50)
    print("THEFT AGENT ANALYSIS")
    print("="*50)
    print(analysis)
    print("="*50)
    
    # Save the analysis
    filename = "sample_theft_analysis.txt"
    with open(filename, "w") as f:
        f.write("CASE DETAILS:\n")
        f.write("="*50 + "\n")
        for key, value in sample_case.items():
            f.write(f"{key.replace('_', ' ').title()}: {value}\n")
        
        f.write("\nANALYSIS:\n")
        f.write("="*50 + "\n")
        f.write(analysis)
    
    print(f"\nAnalysis saved to {filename}")
    print("\nThis was a sample case analysis. You can now enter your own case details.")

def setup_api_key():
    """
    Set up the NVIDIA API key.
    """
    print("\n" + "="*50)
    print("NVIDIA API Key Setup")
    print("="*50)
    print("The API key will be stored in a .env file.")
    print("="*50 + "\n")
    
    api_key = input("Enter your NVIDIA API key: ")
    
    if not api_key:
        print("Error: No API key provided")
        return False
    
    success = store_api_key(api_key)
    
    if success:
        print(f"API key stored successfully in {ENV_FILE}")
        return True
    else:
        print("Failed to store API key")
        return False

def main():
    """Main function to run the Theft Agent."""
    parser = argparse.ArgumentParser(description="Theft Agent")
    parser.add_argument("--api_key", help="NVIDIA API key (optional if stored in .env file)")
    parser.add_argument("--setup", action="store_true", help="Set up the API key")
    parser.add_argument("--sample", action="store_true", help="Analyze a sample case")
    
    args = parser.parse_args()
    
    # Set up API key if requested
    if args.setup:
        setup_api_key()
        return
    
    # Use the provided API key directly
    api_key = API_KEY
    logger.info("Using provided NVIDIA API key")
    
    # Initialize the Theft Agent
    agent = TheftAgent(api_key)
    
    # Analyze sample case if requested
    if args.sample:
        analyze_sample_case(agent)
        return
    
    # Start interactive session
    agent.interactive_session()

if __name__ == "__main__":
    main()
