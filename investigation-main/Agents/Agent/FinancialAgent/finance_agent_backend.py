#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Finance Agent Backend - Improved Implementation

This is a completely new implementation of the Finance Agent backend with
improved conversation state management and proper handling of user inputs.

Usage:
    python finance_agent_backend.py

Author: Augment Agent
"""

import os
import logging
import json
import time
import uuid
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

# Import the finance investigation storage module
try:
    from finance_data_storage import finance_storage
    FINANCE_STORAGE_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("Finance investigation storage module loaded successfully")
except ImportError as e:
    FINANCE_STORAGE_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"Finance investigation storage module not available: {e}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("finance_agent_backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
ENV_FILE = ".env"
API_KEY_VAR = "NVIDIA_API_KEY"
MODEL_NAME = "nvidia/llama-3.1-nemotron-ultra-253b-v1"
PORT = 5003  # Using a different port to avoid conflicts with the unified server

# Dictionary to store conversation states
# Format: {session_id: {current_step: step_name, collected_data: {field: value}, last_updated: timestamp}}
conversation_states = {}

# Financial fraud investigation conversation flow
FINANCIAL_CONVERSATION_STEPS = [
    {
        "id": "case_id",
        "question": "What is the case ID for this financial fraud investigation?",
        "field": "case_id",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Case ID cannot be empty."
    },
    {
        "id": "date_of_incident",
        "question": "When did the financial fraud incident occur? (YYYY-MM-DD format)",
        "field": "date_of_incident",
        "validation": lambda x: bool(re.match(r'\d{4}-\d{2}-\d{2}', x.strip())),
        "error_message": "Please provide the date in YYYY-MM-DD format."
    },
    {
        "id": "time_of_discovery",
        "question": "When was the fraud discovered? (HH:MM format or description)",
        "field": "time_of_discovery",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Time of discovery cannot be empty."
    },
    {
        "id": "financial_institution",
        "question": "Which financial institution is involved? (Bank name, credit union, etc.)",
        "field": "financial_institution",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Financial institution cannot be empty."
    },
    {
        "id": "victim_name",
        "question": "What is the name of the victim (individual or entity)?",
        "field": "victim_name",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Victim name cannot be empty."
    },
    {
        "id": "account_type",
        "question": "What type of account was involved? (checking, savings, credit card, investment, etc.)",
        "field": "account_type",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Account type cannot be empty."
    },
    {
        "id": "account_number",
        "question": "What is the account number? (Please provide only the last 4 digits for security)",
        "field": "account_number",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Account number (last 4 digits) cannot be empty."
    },
    {
        "id": "fraud_type",
        "question": "What type of financial fraud occurred? (identity theft, wire fraud, credit card fraud, etc.)",
        "field": "fraud_type",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Fraud type cannot be empty."
    },
    {
        "id": "amount_involved",
        "question": "What is the financial amount involved? (Include currency if not USD)",
        "field": "amount_involved",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Amount involved cannot be empty."
    },
    {
        "id": "method_used",
        "question": "How was the fraud executed? (Describe the method used by the perpetrator)",
        "field": "method_used",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Method used cannot be empty."
    },
    {
        "id": "suspicious_activity",
        "question": "What suspicious activities or patterns were identified?",
        "field": "suspicious_activity",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Suspicious activity description cannot be empty."
    },
    {
        "id": "evidence_collected",
        "question": "What evidence has been collected? (Digital records, documents, transaction logs, etc.)",
        "field": "evidence_collected",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Evidence description cannot be empty."
    },
    {
        "id": "suspects",
        "question": "Are there any suspects identified? (Names, descriptions, or 'None identified')",
        "field": "suspects",
        "validation": lambda x: len(x.strip()) > 0,
        "error_message": "Suspect information cannot be empty."
    },
    {
        "id": "additional_notes",
        "question": "Any additional relevant information about this financial fraud case?",
        "field": "additional_notes",
        "validation": lambda x: True,  # Optional field
        "error_message": ""
    }
]

def retrieve_api_key():
    """
    Retrieve the API key from the .env file.

    Returns:
        str: The API key if found, None otherwise
    """
    try:
        if os.path.exists(ENV_FILE):
            with open(ENV_FILE, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(f"{API_KEY_VAR}="):
                        api_key = line.split("=", 1)[1].strip()
                        # Remove quotes if present
                        if api_key.startswith('"') and api_key.endswith('"'):
                            api_key = api_key[1:-1]
                        elif api_key.startswith("'") and api_key.endswith("'"):
                            api_key = api_key[1:-1]
                        logger.info("API key retrieved from .env file")
                        return api_key
        logger.warning(f"API key not found in {ENV_FILE}")
        return None
    except Exception as e:
        logger.error(f"Error reading {ENV_FILE}: {e}")
        return None

def get_step_by_id(step_id: str) -> Optional[Dict[str, Any]]:
    """Get a conversation step by its ID."""
    for step in FINANCIAL_CONVERSATION_STEPS:
        if step["id"] == step_id:
            return step
    return None

def get_next_step_id(current_step_id: str) -> Optional[str]:
    """Get the next step ID in the conversation flow."""
    current_index = None
    for i, step in enumerate(FINANCIAL_CONVERSATION_STEPS):
        if step["id"] == current_step_id:
            current_index = i
            break

    if current_index is not None and current_index < len(FINANCIAL_CONVERSATION_STEPS) - 1:
        return FINANCIAL_CONVERSATION_STEPS[current_index + 1]["id"]
    return None

def is_conversation_complete(current_step_id: str) -> bool:
    """Check if the conversation is complete."""
    return current_step_id == FINANCIAL_CONVERSATION_STEPS[-1]["id"]

def initialize_conversation_state(session_id: str) -> Dict[str, Any]:
    """Initialize a new conversation state."""
    state = {
        "current_step": FINANCIAL_CONVERSATION_STEPS[0]["id"],
        "collected_data": {},
        "conversation_pairs": [],
        "last_updated": datetime.now().isoformat(),
        "status": "active"
    }
    conversation_states[session_id] = state
    logger.info(f"Initialized conversation state for session {session_id}")
    return state

def advance_to_next_step(session_id: str, current_step_id: str) -> bool:
    """Advance the conversation to the next step."""
    if session_id not in conversation_states:
        logger.error(f"Session {session_id} not found")
        return False

    next_step_id = get_next_step_id(current_step_id)
    if next_step_id:
        conversation_states[session_id]["current_step"] = next_step_id
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
        logger.info(f"Advanced session {session_id} to step {next_step_id}")
        return True
    else:
        logger.info(f"Conversation complete for session {session_id}")
        return True

def validate_and_store_response(session_id: str, step_id: str, user_response: str) -> tuple[bool, str]:
    """Validate and store a user response for a specific step."""
    step = get_step_by_id(step_id)
    if not step:
        return False, "Invalid step ID"

    # Validate the response
    if not step["validation"](user_response):
        return False, step["error_message"]

    # Store the response
    if session_id not in conversation_states:
        initialize_conversation_state(session_id)

    conversation_states[session_id]["collected_data"][step["field"]] = user_response.strip()
    conversation_states[session_id]["last_updated"] = datetime.now().isoformat()

    # Store the conversation pair
    conversation_states[session_id]["conversation_pairs"].append({
        "question": step["question"],
        "answer": user_response.strip(),
        "step_id": step_id,
        "timestamp": datetime.now().isoformat()
    })

    logger.info(f"Stored response for session {session_id}, step {step_id}")
    return True, ""

def process_user_message(session_id: str, user_message: str) -> tuple[str, Optional[str], bool]:
    """
    Process a user message and return the appropriate response.

    Args:
        session_id: Session identifier
        user_message: User's input message

    Returns:
        Tuple of (response_message, error_message, conversation_complete)
    """
    # Initialize session if it doesn't exist
    if session_id not in conversation_states:
        initialize_conversation_state(session_id)

    state = conversation_states[session_id]
    current_step_id = state["current_step"]
    current_step = get_step_by_id(current_step_id)

    if not current_step:
        return "Error: Invalid conversation state", "Invalid step", True

    # Validate and store the response
    is_valid, error_msg = validate_and_store_response(session_id, current_step_id, user_message)

    if not is_valid:
        return f"Invalid input: {error_msg}. Please try again.\n\n{current_step['question']}", error_msg, False

    # Check if conversation is complete
    if is_conversation_complete(current_step_id):
        # Generate analysis
        collected_data = state["collected_data"]
        conversation_pairs = state["conversation_pairs"]

        # Try to store the investigation data
        try:
            if FINANCE_STORAGE_AVAILABLE:
                case_id = collected_data.get("case_id", f"case_{session_id}")

                # Create user metadata
                user_metadata = {
                    "session_id": session_id,
                    "completion_time": datetime.now().isoformat(),
                    "total_steps": len(FINANCIAL_CONVERSATION_STEPS),
                    "conversation_duration": "calculated_later"
                }

                # Store the investigation data (analysis will be added later)
                finance_storage.store_investigation_data(
                    case_id=case_id,
                    session_id=session_id,
                    extracted_data=collected_data,
                    conversation_pairs=conversation_pairs,
                    ai_analysis=None,  # Will be updated when analysis is generated
                    user_metadata=user_metadata
                )
                logger.info(f"Investigation data stored for case {case_id}")
        except Exception as e:
            logger.error(f"Failed to store investigation data: {e}")
            # Continue with analysis even if storage fails

        return "Thank you for providing all the case details. I will now analyze this financial fraud case and provide comprehensive insights.", None, True

    # Advance to next step
    advance_result = advance_to_next_step(session_id, current_step_id)
    if not advance_result:
        logger.error(f"Failed to advance to next step from {current_step_id}")
        # This is not a fatal error, so we continue

    # Get the next step and return its question
    next_state = conversation_states[session_id]
    next_step_id = next_state["current_step"]
    next_step = get_step_by_id(next_step_id)

    if next_step:
        return next_step["question"], None, False
    else:
        return "Error: Could not determine next step", "Invalid next step", True

class FinanceAgent:
    """
    Main interface for the Finance Agent that analyzes financial fraud cases using the NVIDIA API.
    """

    def __init__(self, api_key: str):
        """
        Initialize the Finance Agent.

        Args:
            api_key: NVIDIA API key
        """
        self.api_key = api_key
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        logger.info(f"Finance Agent initialized with model: {MODEL_NAME}")

    def analyze_case(self, case_details):
        """
        Analyze a financial fraud case using the NVIDIA model.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Analysis and solutions for the case
        """
        logger.info("Analyzing financial fraud case")

        # Format the case details into a prompt
        prompt = self._format_case_prompt(case_details)

        try:
            # Call the NVIDIA API with the real API key
            logger.info("Calling NVIDIA API for financial fraud analysis")

            system_prompt = "You are a Finance Agent, an AI assistant specialized in analyzing and solving financial fraud cases. Provide detailed analysis, insights, and investigative approaches based solely on the case details provided. Focus on the specific information given and avoid making assumptions beyond what's in the data."

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
            logger.info("Financial fraud case analysis completed")
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing financial fraud case: {str(e)}")
            return self._generate_fallback_analysis(case_details)

    def _generate_fallback_analysis(self, case_details):
        """
        Generate a fallback analysis when the API is unavailable.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Simulated analysis
        """
        # Extract key details
        case_id = case_details.get("case_id", "Unknown")
        fraud_type = case_details.get("fraud_type", "unknown fraud type")
        amount_involved = case_details.get("amount_involved", "unknown amount")
        victim_name = case_details.get("victim_name", "the victim")
        financial_institution = case_details.get("financial_institution", "unknown institution")
        method_used = case_details.get("method_used", "unknown method")
        evidence_collected = case_details.get("evidence_collected", "No evidence reported")
        suspects = case_details.get("suspects", "No suspects identified")

        # Build a dynamic analysis based on the specific case details
        analysis = "# FINANCIAL FRAUD CASE ANALYSIS\n\n"
        analysis += f"**Case ID:** {case_id}\n"
        analysis += f"**Fraud Type:** {fraud_type}\n"
        analysis += f"**Financial Impact:** {amount_involved}\n\n"

        analysis += "## CASE OVERVIEW\n"
        analysis += f"This investigation involves a {fraud_type} case affecting {victim_name} "
        analysis += f"at {financial_institution}. The fraudulent activity resulted in "
        analysis += f"financial losses of {amount_involved}.\n\n"

        analysis += "## FRAUD METHODOLOGY\n"
        analysis += f"Based on the reported information, the fraud was executed using: {method_used}\n\n"

        analysis += "## EVIDENCE ANALYSIS\n"
        analysis += f"Available evidence includes: {evidence_collected}\n\n"

        analysis += "## SUSPECT INFORMATION\n"
        analysis += f"Current suspect status: {suspects}\n\n"

        analysis += "## INVESTIGATIVE RECOMMENDATIONS\n"
        analysis += "1. **Immediate Actions:**\n"
        analysis += "   - Secure all affected accounts\n"
        analysis += "   - Preserve digital evidence\n"
        analysis += "   - Contact relevant financial institutions\n\n"

        analysis += "2. **Evidence Collection:**\n"
        analysis += "   - Transaction logs and timestamps\n"
        analysis += "   - IP addresses and device information\n"
        analysis += "   - Communication records\n\n"

        analysis += "3. **Recovery Strategies:**\n"
        analysis += "   - Work with financial institutions for fund recovery\n"
        analysis += "   - File appropriate reports with authorities\n"
        analysis += "   - Implement enhanced security measures\n\n"

        analysis += "## PREVENTION MEASURES\n"
        analysis += "- Enhanced authentication protocols\n"
        analysis += "- Regular account monitoring\n"
        analysis += "- Employee/customer education programs\n"
        analysis += "- Advanced fraud detection systems\n\n"

        analysis += "---\n"
        analysis += "*This analysis is based on the provided case details and standard financial fraud investigation protocols.*"

        return analysis

    def _format_case_prompt(self, case_details):
        """
        Format case details into a prompt for the model.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Formatted prompt string
        """
        # Check if this is a direct question
        if "question" in case_details and len(case_details) <= 3:  # Only question and maybe case_id/additional_notes
            question = case_details["question"]
            prompt = f"As a Financial Fraud Investigation AI Agent specialized in financial crimes and forensic analysis, please answer the following question:\n\n{question}\n\n"

            if "additional_notes" in case_details and case_details["additional_notes"]:
                prompt += f"Additional context: {case_details['additional_notes']}\n\n"

            prompt += "Provide a detailed, evidence-based response using your expertise in financial forensics, fraud detection, and investigative techniques."
            return prompt

        # Full case analysis
        prompt = "Analyze the following financial fraud case and provide comprehensive insights:\n\n"

        # Add case details
        for key, value in case_details.items():
            if value and str(value).strip():
                formatted_key = key.replace('_', ' ').title()
                prompt += f"**{formatted_key}:** {value}\n"

        prompt += "\n## ANALYSIS REQUEST\n"
        prompt += "Please provide a comprehensive analysis including:\n\n"
        prompt += "1. **Case Assessment:** Overview of the fraud type and severity\n"
        prompt += "2. **Fraud Methodology:** How the fraud was likely executed\n"
        prompt += "3. **Evidence Analysis:** Evaluation of available evidence\n"
        prompt += "4. **Investigative Approach:** Recommended investigation steps\n"
        prompt += "5. **Recovery Strategy:** Steps for fund recovery and damage mitigation\n"
        prompt += "6. **Prevention Measures:** Recommendations to prevent similar incidents\n"
        prompt += "7. **Legal Considerations:** Relevant laws and reporting requirements\n\n"
        prompt += "Focus on actionable insights based on the specific details provided."

        return prompt
