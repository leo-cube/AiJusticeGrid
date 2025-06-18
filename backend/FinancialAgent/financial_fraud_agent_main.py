#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Financial Fraud Agent - Main Interface

This is the main file that interacts with the NVIDIA Llama-3.1-Nemotron-Ultra-253B model
trained on financial fraud datasets to provide solutions based on user-provided case data.

Usage:
    python financial_fraud_agent_main.py
    python financial_fraud_agent_main.py --api  # Run as API server

Author: Augment Agent
"""

import os
import argparse
import logging
import json
import time
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from openai import OpenAI
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("financial_fraud_agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
ENV_FILE = ".env"
API_KEY_VAR = "NVIDIA_API_KEY"
MODEL_NAME = "nvidia/llama-3.1-nemotron-ultra-253b-v1"

# Dictionary to store conversation states
# Format: {session_id: {current_step: step_name, collected_data: {field: value}}}
conversation_states = {}

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

def setup_api_key():
    """
    Set up the API key by prompting the user and saving it to the .env file.
    """
    print("Setting up NVIDIA API key...")
    api_key = input("Please enter your NVIDIA API key: ").strip()

    if not api_key:
        print("No API key provided. Exiting.")
        return

    try:
        with open(ENV_FILE, 'w') as f:
            f.write(f"{API_KEY_VAR}={api_key}\n")
        print(f"API key saved to {ENV_FILE}")
        logger.info("API key setup completed")
    except Exception as e:
        print(f"Error saving API key: {e}")
        logger.error(f"Error saving API key: {e}")

# Define the case information collection steps (following Murder Agent pattern)
CASE_INFO_STEPS = [
    {
        "id": "greeting",
        "message": "Hello, I'm the Financial Fraud Agent, an AI assistant specialized in financial fraud investigations. I'll help you analyze a financial fraud case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
        "question": "Hello, I'm the Financial Fraud Agent, an AI assistant specialized in financial fraud investigations. I'll help you analyze a financial fraud case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
        "field": "case_id",
        "next_step": "date_of_incident",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid Case ID."
    },
    {
        "id": "date_of_incident",
        "message": "When did the financial fraud incident occur? Please provide the date (YYYY-MM-DD).",
        "question": "When did the financial fraud incident occur? Please provide the date (YYYY-MM-DD).",
        "field": "date_of_incident",
        "next_step": "time_of_discovery",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid date."
    },
    {
        "id": "time_of_discovery",
        "message": "When was the fraud discovered? (HH:MM format or description)",
        "question": "When was the fraud discovered? (HH:MM format or description)",
        "field": "time_of_discovery",
        "next_step": "financial_institution",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid time or description."
    },
    {
        "id": "financial_institution",
        "message": "Which financial institution is involved? (Bank name, credit union, etc.)",
        "question": "Which financial institution is involved? (Bank name, credit union, etc.)",
        "field": "financial_institution",
        "next_step": "victim_name",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid financial institution name."
    },
    {
        "id": "victim_name",
        "message": "What is the name of the victim (individual or entity)?",
        "question": "What is the name of the victim (individual or entity)?",
        "field": "victim_name",
        "next_step": "account_type",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid victim name."
    },
    {
        "id": "account_type",
        "message": "What type of account was involved? (checking, savings, credit card, investment, etc.)",
        "question": "What type of account was involved? (checking, savings, credit card, investment, etc.)",
        "field": "account_type",
        "next_step": "account_number",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid account type."
    },
    {
        "id": "account_number",
        "message": "What is the account number? (Please provide only the last 4 digits for security)",
        "question": "What is the account number? (Please provide only the last 4 digits for security)",
        "field": "account_number",
        "next_step": "fraud_type",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide valid account information."
    },
    {
        "id": "fraud_type",
        "message": "What type of financial fraud occurred? (identity theft, wire fraud, credit card fraud, etc.)",
        "question": "What type of financial fraud occurred? (identity theft, wire fraud, credit card fraud, etc.)",
        "field": "fraud_type",
        "next_step": "amount_involved",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid fraud type."
    },
    {
        "id": "amount_involved",
        "message": "What is the financial amount involved? (Include currency if not USD)",
        "question": "What is the financial amount involved? (Include currency if not USD)",
        "field": "amount_involved",
        "next_step": "method_used",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid amount."
    },
    {
        "id": "method_used",
        "message": "How was the fraud executed? (Describe the method used by the perpetrator)",
        "question": "How was the fraud executed? (Describe the method used by the perpetrator)",
        "field": "method_used",
        "next_step": "suspicious_activity",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide a valid description of the method used."
    },
    {
        "id": "suspicious_activity",
        "message": "What suspicious activities or patterns were identified?",
        "question": "What suspicious activities or patterns were identified?",
        "field": "suspicious_activity",
        "next_step": "evidence_collected",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide information about suspicious activities."
    },
    {
        "id": "evidence_collected",
        "message": "What evidence has been collected? (Digital records, documents, transaction logs, etc.)",
        "question": "What evidence has been collected? (Digital records, documents, transaction logs, etc.)",
        "field": "evidence_collected",
        "next_step": "suspects",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide information about evidence collected."
    },
    {
        "id": "suspects",
        "message": "Are there any suspects identified? (Names, descriptions, or 'None identified')",
        "question": "Are there any suspects identified? (Names, descriptions, or 'None identified')",
        "field": "suspects",
        "next_step": "additional_notes",
        "validation": lambda x: bool(x and x.strip()),
        "error_message": "Please provide information about suspects or indicate 'None identified'."
    },
    {
        "id": "additional_notes",
        "message": "Any additional relevant information about this financial fraud case?",
        "question": "Any additional relevant information about this financial fraud case?",
        "field": "additional_notes",
        "next_step": "analysis",
        "validation": lambda x: True,  # Allow empty for additional notes
        "error_message": "Please provide any additional information or type 'None'."
    }
]

# Define the correct field names for storing data
FIELD_NAMES = {
    "case_id": "case_id",
    "date_of_incident": "date_of_incident",
    "time_of_discovery": "time_of_discovery",
    "financial_institution": "financial_institution",
    "victim_name": "victim_name",
    "account_type": "account_type",
    "account_number": "account_number",
    "fraud_type": "fraud_type",
    "amount_involved": "amount_involved",
    "method_used": "method_used",
    "suspicious_activity": "suspicious_activity",
    "evidence_collected": "evidence_collected",
    "suspects": "suspects",
    "additional_notes": "additional_notes"
}

# Keep FINANCIAL_CONVERSATION_STEPS for backward compatibility
FINANCIAL_CONVERSATION_STEPS = CASE_INFO_STEPS

# Helper function to get step by ID
def get_step_by_id(step_id):
    """Get a step by its ID."""
    for step in CASE_INFO_STEPS:
        if step["id"] == step_id:
            return step
    return None

def get_next_step_id(current_step_id: str) -> Optional[str]:
    """Get the next step ID in the conversation flow."""
    current_index = None
    for i, step in enumerate(CASE_INFO_STEPS):
        if step["id"] == current_step_id:
            current_index = i
            break

    if current_index is not None and current_index < len(CASE_INFO_STEPS) - 1:
        return CASE_INFO_STEPS[current_index + 1]["id"]
    return None

def is_conversation_complete(current_step_id: str) -> bool:
    """Check if the conversation is complete."""
    return current_step_id == CASE_INFO_STEPS[-1]["id"]

# Helper function to store user input
def store_user_input(session_id, current_step_id, user_input):
    """Store user input for the current step."""
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found in conversation states")
        return False

    # Get the current step
    current_step = get_step_by_id(current_step_id)
    if not current_step:
        logger.error(f"Step {current_step_id} not found")
        return False

    # Store the user input if this step has a field
    if current_step["field"]:
        # Get the correct field name for storing the data
        field_name = FIELD_NAMES.get(current_step["field"], current_step["field"])

        # Store the user input in the correct field
        conversation_states[session_id]["collected_data"][field_name] = user_input
        logger.info(f"Stored user input in field {field_name}: {user_input}")

    return True

# Helper function to get or create conversation state
def get_or_create_conversation_state(session_id):
    """Get existing conversation state or create a new one."""
    if session_id and session_id in conversation_states:
        return session_id, conversation_states[session_id]

    # Create new session
    new_session_id = str(uuid.uuid4())
    conversation_states[new_session_id] = {
        "current_step": "greeting",
        "collected_data": {},
        "conversation_pairs": [],
        "last_updated": datetime.now().isoformat(),
        "status": "active"
    }
    logger.info(f"Created new conversation state for session {new_session_id}")
    return new_session_id, conversation_states[new_session_id]

def create_new_conversation_state():
    """Create a new conversation state and return the session ID."""
    session_id = str(uuid.uuid4())
    conversation_states[session_id] = {
        "current_step": "greeting",
        "collected_data": {},
        "conversation_pairs": [],
        "last_updated": datetime.now().isoformat(),
        "status": "active"
    }
    logger.info(f"Created new conversation state for session {session_id}")
    return session_id

def initialize_conversation_state(session_id: str) -> Dict[str, Any]:
    """Initialize a new conversation state."""
    state = {
        "current_step": "greeting",
        "collected_data": {},
        "conversation_pairs": [],
        "last_updated": datetime.now().isoformat(),
        "status": "active"
    }
    conversation_states[session_id] = state
    logger.info(f"Initialized conversation state for session {session_id}")
    return state

# Helper function to process user input and update conversation state
def process_user_input(session_id, user_input):
    """Process user input and update the conversation state."""
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found in conversation states")
        # Create a new session if the session ID doesn't exist
        new_session_id, conv_state = get_or_create_conversation_state(None)
        logger.info(f"Created new session {new_session_id} for non-existent session {session_id}")
        return new_session_id, conv_state, None

    # Get the current conversation state
    conv_state = conversation_states[session_id]
    current_step_id = conv_state["current_step"]

    # Log the current state and user input
    logger.info(f"Processing user input for session {session_id}, step {current_step_id}: {user_input}")
    logger.info(f"Current conversation state: {conv_state}")

    # Validate and store the user input
    current_step = get_step_by_id(current_step_id)
    if not current_step:
        logger.error(f"Current step {current_step_id} not found")
        return session_id, conv_state, "Invalid step"

    # Validate the response if validation function exists
    if "validation" in current_step and current_step["validation"]:
        try:
            if not current_step["validation"](user_input):
                error_msg = current_step.get("error_message", "Invalid input")
                logger.info(f"Validation failed for step {current_step_id}: {error_msg}")
                return session_id, conv_state, error_msg
        except Exception as e:
            logger.error(f"Error during validation for step {current_step_id}: {e}")
            # Continue without validation if there's an error

    # Store the user input
    store_result = store_user_input(session_id, current_step_id, user_input)
    if not store_result:
        logger.error(f"Failed to store user input: {user_input}")
        return session_id, conv_state, "Failed to store input"

    # Store the conversation pair
    conversation_states[session_id]["conversation_pairs"].append({
        "question": current_step.get("question", current_step.get("message", "")),
        "answer": user_input.strip(),
        "step_id": current_step_id,
        "timestamp": datetime.now().isoformat()
    })

    # Move to the next step
    next_step_id = current_step.get("next_step")
    if next_step_id:
        conversation_states[session_id]["current_step"] = next_step_id
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
        logger.info(f"Advanced session {session_id} to step {next_step_id}")
    else:
        logger.info(f"No next step defined for {current_step_id}")

    return session_id, conversation_states[session_id], None

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

def validate_and_store_response(session_id: str, step_id: str, user_response: str) -> Tuple[bool, str]:
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

def process_user_message(session_id: str, user_message: str) -> Tuple[str, Optional[str], bool]:
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
            from finance_data_storage import finance_storage
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

    # Return the updated conversation state
    return session_id, conversation_states[session_id], None

class FinancialFraudAgent:
    """
    Main interface for the Financial Fraud Agent that analyzes financial fraud cases using the NVIDIA API.
    """

    def __init__(self, api_key: str):
        """
        Initialize the Financial Fraud Agent.

        Args:
            api_key: NVIDIA API key
        """
        if not api_key:
            raise ValueError("API key is required for Financial Fraud Agent initialization")

        # Clean and validate the API key
        self.api_key = api_key.strip() if isinstance(api_key, str) else str(api_key).strip()

        # Remove any potential extra characters or formatting issues
        self.api_key = self.api_key.replace('\n', '').replace('\r', '').replace('\t', '')

        if not self.api_key:
            raise ValueError("API key cannot be empty")

        # Validate API key format (should start with nvapi-)
        if not self.api_key.startswith('nvapi-'):
            raise ValueError(f"Invalid API key format. Expected to start with 'nvapi-', got: {self.api_key[:10]}...")

        logger.info(f"Initializing Financial Fraud Agent with API key length: {len(self.api_key)}")

        try:
            # Initialize OpenAI client with minimal parameters to avoid compatibility issues
            self.client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=self.api_key
            )
            logger.info(f"Financial Fraud Agent initialized successfully with model: {MODEL_NAME}")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            logger.error(f"API key being used: {self.api_key[:15]}...")

            # Try alternative initialization methods (same as Murder Agent)
            try:
                logger.info("Attempting alternative OpenAI client initialization...")
                import openai
                logger.info(f"OpenAI library version: {openai.__version__}")

                # Method 1: Try with explicit http_client=None
                try:
                    self.client = OpenAI(
                        base_url="https://integrate.api.nvidia.com/v1",
                        api_key=self.api_key,
                        http_client=None
                    )
                    logger.info("Alternative initialization with http_client=None successful!")
                except Exception as e3:
                    logger.info(f"http_client=None failed: {str(e3)}")

                    # Method 2: Try with older style initialization
                    try:
                        # For older versions of openai library
                        openai.api_key = self.api_key
                        openai.api_base = "https://integrate.api.nvidia.com/v1"

                        # Create a simple client wrapper
                        class SimpleOpenAIClient:
                            def __init__(self, api_key, base_url):
                                self.api_key = api_key
                                self.base_url = base_url

                            def chat_completions_create(self, **kwargs):
                                # This will be implemented if needed
                                import requests
                                headers = {
                                    "Authorization": f"Bearer {self.api_key}",
                                    "Content-Type": "application/json"
                                }
                                try:
                                    response = requests.post(
                                        f"{self.base_url}/chat/completions",
                                        headers=headers,
                                        json=kwargs,
                                        timeout=30
                                    )
                                    response.raise_for_status()
                                    result = response.json()

                                    # Create a mock response object that mimics OpenAI's response structure
                                    class MockResponse:
                                        def __init__(self, data):
                                            self.choices = [MockChoice(data['choices'][0])]

                                    class MockChoice:
                                        def __init__(self, choice_data):
                                            self.message = MockMessage(choice_data['message'])

                                    class MockMessage:
                                        def __init__(self, message_data):
                                            self.content = message_data['content']

                                    return MockResponse(result)
                                except requests.exceptions.RequestException as e:
                                    raise Exception(f"API request failed: {str(e)}")
                                except Exception as e:
                                    raise Exception(f"Error processing response: {str(e)}")

                            @property
                            def chat(self):
                                """Property to mimic OpenAI client structure."""
                                class ChatCompletions:
                                    def __init__(self, client):
                                        self.client = client

                                    @property
                                    def completions(self):
                                        class CompletionsCreate:
                                            def __init__(self, client):
                                                self.client = client

                                            def create(self, **kwargs):
                                                return self.client.chat_completions_create(**kwargs)

                                        return CompletionsCreate(self.client)

                                return ChatCompletions(self)

                        self.client = SimpleOpenAIClient(self.api_key, "https://integrate.api.nvidia.com/v1")
                        logger.info("Fallback client initialization successful!")

                    except Exception as e4:
                        logger.error(f"All initialization methods failed. Last error: {str(e4)}")
                        raise e

            except Exception as e2:
                logger.error(f"Alternative initialization also failed: {str(e2)}")
                raise e

        # Add conversation states and case info steps for compatibility with unified server
        self.conversation_states = conversation_states
        self.CASE_INFO_STEPS = CASE_INFO_STEPS

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

            system_prompt = "You are a Financial Fraud Agent, an AI assistant specialized in analyzing and solving financial fraud cases. Provide detailed analysis, insights, and investigative approaches based solely on the case details provided. Focus on the specific information given and avoid making assumptions beyond what's in the data."

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

    def process_message(self, message, session_id=None, force_new_session=False, reset_conversation=False):
        """
        Process a message from the user and update the conversation state.

        Args:
            message: The user's message
            session_id: Optional session ID for continuing a conversation
            force_new_session: Force creation of a new session regardless of existing session
            reset_conversation: Reset the conversation state but keep the session ID

        Returns:
            Tuple of (session_id, response, is_collecting_info, current_step, error_message)
        """
        logger.info(f"Processing message: {message} with session_id: {session_id}")
        logger.info(f"force_new_session: {force_new_session}, reset_conversation: {reset_conversation}")

        # Check for special commands or flags
        if message and message.lower() in ["reset", "restart", "start over"] or force_new_session:
            logger.info(f"Reset command detected or force_new_session is True")

            # If we have a session ID and it exists, delete it
            if session_id and session_id in conversation_states and not reset_conversation:
                logger.info(f"Deleting conversation state for session {session_id}")
                del conversation_states[session_id]

            # If we're forcing a new session, always create a new one
            if force_new_session:
                logger.info("Forcing creation of a new session")
                session_id = str(uuid.uuid4())
                initialize_conversation_state(session_id)
            # If we're resetting the conversation but keeping the session ID
            elif reset_conversation and session_id and session_id in conversation_states:
                logger.info(f"Resetting conversation state for session {session_id}")
                conversation_states[session_id] = {
                    "current_step": "greeting",
                    "collected_data": {},
                    "conversation_pairs": [],
                    "last_updated": datetime.now().isoformat(),
                    "status": "active"
                }
            # Otherwise, create a new session
            else:
                logger.info("Creating a new session")
                session_id = str(uuid.uuid4())
                initialize_conversation_state(session_id)

            current_step = get_step_by_id("greeting")

            # Return the greeting message
            return session_id, current_step["message"], True, "greeting", None

        # Create a new session if none exists
        if not session_id or session_id not in conversation_states:
            logger.info(f"Creating new session (old session_id: {session_id})")
            session_id = str(uuid.uuid4())
            initialize_conversation_state(session_id)
            logger.info(f"Created new session: {session_id}")

            # If this is a new session and there's no message, return the greeting
            if not message:
                current_step = get_step_by_id("greeting")
                return session_id, current_step["message"], True, "greeting", None

        # Get the current conversation state
        conv_state = conversation_states[session_id]
        current_step_id = conv_state["current_step"]

        logger.info(f"Current step: {current_step_id}")
        logger.info(f"Current conversation state: {conv_state}")

        # If this is the first message (greeting) and there's no message, return the greeting
        if current_step_id == "greeting" and not message:
            logger.info("First message (greeting), returning greeting message")
            return session_id, get_step_by_id("greeting")["message"], True, "greeting", None

        # Process the user input and update the conversation state
        if message:
            # Update the conversation state with the user's input
            session_id, updated_state, error_message = process_user_input(session_id, message)

            # If there was an error, return the error message and stay on the current step
            if error_message:
                current_step = get_step_by_id(current_step_id)
                # Create a more user-friendly error message with examples
                error_response = f"I couldn't process your input: {error_message}\n\nPlease try again. {current_step['message']}"
                return session_id, error_response, True, current_step_id, error_message

            # Get the updated step
            current_step_id = updated_state["current_step"]
            current_step = get_step_by_id(current_step_id)

            # If we've reached the analysis step, perform the analysis
            if current_step_id == "analysis":
                try:
                    # Get the collected data
                    collected_data = updated_state["collected_data"]
                    logger.info(f"Performing analysis with collected data: {collected_data}")

                    # Perform the analysis
                    analysis = self.analyze_case(collected_data)

                    # Return the analysis
                    return session_id, analysis, False, "analysis", None
                except Exception as e:
                    logger.error(f"Error analyzing case: {str(e)}")
                    return session_id, f"Error analyzing case: {str(e)}", False, "analysis", str(e)

            # Return the next question
            if current_step and current_step["message"]:
                return session_id, current_step["message"], True, current_step_id, None

        # If we've reached this point, something went wrong
        # Return the current step's question
        current_step = get_step_by_id(current_step_id)
        return session_id, current_step["message"] if current_step else "What would you like to know?", True, current_step_id, None

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

    def interactive_session(self):
        """
        Start an interactive session with the Financial Fraud Agent.
        """
        print("\n" + "="*50)
        print("Welcome to the Financial Fraud Agent")
        print("Enter case details to receive analysis and solutions")
        print("Type 'exit' to end the session")
        print("="*50 + "\n")

        while True:
            case_details = {}

            print("\nEnter case details (press Enter after each entry, leave blank to skip):")

            case_details["case_id"] = input("Case ID: ")
            if case_details["case_id"].lower() == "exit":
                break

            case_details["date_detected"] = input("Date Detected: ")
            case_details["fraud_type"] = input("Fraud Type (e.g., credit card, identity theft, wire fraud): ")
            case_details["amount_involved"] = input("Amount Involved: ")
            case_details["victim_details"] = input("Victim Details (individual/organization): ")
            case_details["transaction_details"] = input("Transaction Details: ")
            case_details["suspicious_activities"] = input("Suspicious Activities Observed: ")
            case_details["account_information"] = input("Account Information: ")
            case_details["detection_method"] = input("How Was the Fraud Detected: ")
            case_details["evidence_available"] = input("Evidence Available: ")
            case_details["suspect_information"] = input("Suspect Information (if any): ")
            case_details["existing_security_measures"] = input("Existing Security Measures: ")
            case_details["previous_incidents"] = input("Previous Similar Incidents: ")
            case_details["additional_notes"] = input("Additional Notes: ")

            # Remove empty fields
            case_details = {k: v for k, v in case_details.items() if v}

            if not case_details:
                print("No case details provided. Please try again.")
                continue

            print("\nAnalyzing case...")
            analysis = self.analyze_case(case_details)

            print("\n" + "="*50)
            print("FINANCIAL FRAUD AGENT ANALYSIS")
            print("="*50)
            print(analysis)
            print("="*50)

            save_option = input("\nWould you like to save this analysis? (y/n): ")
            if save_option.lower() == 'y':
                case_id = case_details.get("case_id", f"case_{int(time.time())}")
                filename = f"fraud_analysis_{case_id}.txt"

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

        print("\nThank you for using the Financial Fraud Agent. Goodbye!")

def analyze_sample_case(agent):
    """
    Analyze a sample financial fraud case to demonstrate the Financial Fraud Agent.

    Args:
        agent: Initialized FinancialFraudAgent instance
    """
    # Sample case details
    sample_case = {
        "case_id": "FRAUD-001",
        "date_detected": "2023-09-15",
        "fraud_type": "Credit Card Fraud with Identity Theft",
        "amount_involved": "$24,750",
        "victim_details": "John Smith, 45-year-old business executive",
        "transaction_details": "Multiple high-value purchases at electronics stores and luxury retailers across three states within 48 hours",
        "suspicious_activities": "Unusual transaction locations, purchases outside normal spending pattern, transactions at odd hours (2-4 AM)",
        "account_information": "Platinum credit card with $50,000 limit, account opened 7 years ago with good standing",
        "detection_method": "Bank's fraud detection system flagged unusual spending pattern, victim also reported unrecognized transactions",
        "evidence_available": "Transaction logs, CCTV footage from two stores, IP addresses used for online purchases, phone call recordings to customer service where someone attempted to change account details",
        "suspect_information": "Unknown individuals, but customer service reported caller with heavy accent claiming to be account holder",
        "existing_security_measures": "Two-factor authentication for online banking, chip and PIN for in-person transactions, transaction alerts for purchases over $1,000",
        "previous_incidents": "Victim reported mail theft from residential mailbox one month prior to fraud",
        "additional_notes": "Victim attended a tech conference two weeks before fraud was detected where he used his card at multiple vendors"
    }

    print("\n" + "="*50)
    print("FINANCIAL FRAUD AGENT SAMPLE CASE")
    print("="*50 + "\n")

    print("Analyzing sample financial fraud case...")
    print("\nCase Details:")
    for key, value in sample_case.items():
        print(f"{key.replace('_', ' ').title()}: {value}")

    # Analyze the case
    analysis = agent.analyze_case(sample_case)

    print("\n" + "="*50)
    print("FINANCIAL FRAUD AGENT ANALYSIS")
    print("="*50)
    print(analysis)
    print("="*50)

    # Save the analysis
    filename = "sample_fraud_analysis.txt"
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

def store_api_key(api_key):
    """
    Store the API key in the .env file.

    Args:
        api_key: The API key to store

    Returns:
        Boolean indicating success
    """
    try:
        with open(ENV_FILE, 'w') as f:
            f.write(f"{API_KEY_VAR}={api_key}\n")
        logger.info(f"API key stored in {ENV_FILE}")
        return True
    except Exception as e:
        logger.error(f"Error storing API key: {str(e)}")
        return False

def analyze_sample_case(agent):
    """
    Analyze a sample financial fraud case to demonstrate the Financial Fraud Agent.

    Args:
        agent: Initialized FinancialFraudAgent instance
    """
    # Sample case details
    sample_case = {
        "case_id": "FRAUD-001",
        "date_of_incident": "2023-09-15",
        "time_of_discovery": "08:30 AM",
        "financial_institution": "First National Bank",
        "victim_name": "John Smith",
        "account_type": "Checking Account",
        "account_number": "****1234",
        "fraud_type": "Credit Card Fraud with Identity Theft",
        "amount_involved": "$24,750",
        "method_used": "Skimming device at ATM, followed by online purchases",
        "suspicious_activity": "Multiple high-value purchases at electronics stores across three states within 48 hours",
        "evidence_collected": "Transaction logs, CCTV footage from ATM, IP addresses from online purchases",
        "suspects": "Unknown individuals, investigation ongoing",
        "additional_notes": "Victim reported suspicious activity on account after receiving fraud alerts"
    }

    print("\n" + "="*50)
    print("FINANCIAL FRAUD AGENT SAMPLE CASE")
    print("="*50 + "\n")

    print("Analyzing sample financial fraud case...")
    print("\nCase Details:")
    for key, value in sample_case.items():
        print(f"{key.replace('_', ' ').title()}: {value}")

    # Analyze the case
    analysis = agent.analyze_case(sample_case)

    print("\n" + "="*50)
    print("FINANCIAL FRAUD AGENT ANALYSIS")
    print("="*50)
    print(analysis)
    print("="*50)

    # Save the analysis
    filename = "sample_fraud_analysis.txt"
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

def run_api_server(api_key):
    """
    Run the Financial Fraud Agent as an API server.

    Args:
        api_key: NVIDIA API key
    """
    app = Flask(__name__)
    CORS(app)

    # Initialize the agent
    agent = FinancialFraudAgent(api_key)

    @app.route('/analyze', methods=['POST'])
    def analyze_endpoint():
        """API endpoint for case analysis."""
        try:
            case_details = request.json
            if not case_details:
                return jsonify({"error": "No case details provided"}), 400

            analysis = agent.analyze_case(case_details)
            return jsonify({"analysis": analysis})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        return jsonify({"status": "healthy", "agent": "Financial Fraud Agent"})

    print(f"Starting Financial Fraud Agent API server on port 5002...")
    app.run(host="0.0.0.0", port=5002, debug=True)

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
    """Main function to run the Financial Fraud Agent."""
    import argparse

    parser = argparse.ArgumentParser(description="Financial Fraud Agent")
    parser.add_argument("--api_key", help="NVIDIA API key (optional if stored in .env file)")
    parser.add_argument("--setup", action="store_true", help="Set up the API key")
    parser.add_argument("--sample", action="store_true", help="Analyze a sample case")
    parser.add_argument("--api", action="store_true", help="Run as API server")

    args = parser.parse_args()

    # Set up API key if requested
    if args.setup:
        setup_api_key()
        return

    # Get API key from .env file or use provided key
    api_key = None
    if args.api_key:
        api_key = args.api_key
        logger.info("Using provided API key from command line")
    else:
        # Try to get API key from .env file
        api_key = retrieve_api_key()
        if not api_key:
            # Use default API key if not found in .env
            api_key = "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"
            logger.info("Using default NVIDIA API key")
        else:
            logger.info("Using API key from .env file")

    # Run as API server if requested
    if args.api:
        run_api_server(api_key)
        return

    # Initialize the Financial Fraud Agent
    agent = FinancialFraudAgent(api_key)

    # Analyze sample case if requested
    if args.sample:
        analyze_sample_case(agent)
        return

    # Start interactive session
    agent.interactive_session()

if __name__ == "__main__":
    main()
