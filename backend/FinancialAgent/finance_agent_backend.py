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

# Define the case information collection steps (following Murder Agent pattern)
CASE_INFO_STEPS = [
    {
        "id": "greeting",
        "message": "Hello, I'm the Financial Fraud Agent, an AI assistant specialized in financial fraud investigations. I'll help you analyze a financial fraud case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
        "field": "case_id",
        "next_step": "date_of_incident"
    },
    {
        "id": "date_of_incident",
        "message": "When did the financial fraud incident occur? Please provide the date (YYYY-MM-DD).",
        "field": "date_of_incident",
        "next_step": "time_of_discovery"
    },
    {
        "id": "time_of_discovery",
        "message": "When was the fraud discovered? (HH:MM format or description)",
        "field": "time_of_discovery",
        "next_step": "financial_institution"
    },
    {
        "id": "financial_institution",
        "message": "Which financial institution is involved? (Bank name, credit union, etc.)",
        "field": "financial_institution",
        "next_step": "victim_name"
    },
    {
        "id": "victim_name",
        "message": "What is the name of the victim (individual or entity)?",
        "field": "victim_name",
        "next_step": "account_type"
    },
    {
        "id": "account_type",
        "message": "What type of account was involved? (checking, savings, credit card, investment, etc.)",
        "field": "account_type",
        "next_step": "account_number"
    },
    {
        "id": "account_number",
        "message": "What is the account number? (Please provide only the last 4 digits for security)",
        "field": "account_number",
        "next_step": "fraud_type"
    },
    {
        "id": "fraud_type",
        "message": "What type of financial fraud occurred? (identity theft, wire fraud, credit card fraud, etc.)",
        "field": "fraud_type",
        "next_step": "amount_involved"
    },
    {
        "id": "amount_involved",
        "message": "What is the financial amount involved? (Include currency if not USD)",
        "field": "amount_involved",
        "next_step": "method_used"
    },
    {
        "id": "method_used",
        "message": "How was the fraud executed? (Describe the method used by the perpetrator)",
        "field": "method_used",
        "next_step": "suspicious_activity"
    },
    {
        "id": "suspicious_activity",
        "message": "What suspicious activities or patterns were identified?",
        "field": "suspicious_activity",
        "next_step": "evidence_collected"
    },
    {
        "id": "evidence_collected",
        "message": "What evidence has been collected? (Digital records, documents, transaction logs, etc.)",
        "field": "evidence_collected",
        "next_step": "suspects"
    },
    {
        "id": "suspects",
        "message": "Are there any suspects identified? (Names, descriptions, or 'None identified')",
        "field": "suspects",
        "next_step": "additional_notes"
    },
    {
        "id": "additional_notes",
        "message": "Any additional relevant information about this financial fraud case?",
        "field": "additional_notes",
        "next_step": "analysis"
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
    import uuid
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
    import uuid
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

    # Get the current step
    current_step = get_step_by_id(current_step_id)
    if not current_step:
        logger.error(f"Current step {current_step_id} not found")
        return session_id, conv_state, "Invalid step"

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

def validate_and_store_response(session_id: str, step_id: str, user_response: str) -> tuple[bool, str]:
    """Validate and store a user response for a specific step."""
    step = get_step_by_id(step_id)
    if not step:
        return False, "Invalid step ID"

    # Store the response (no validation in Murder Agent pattern)
    if session_id not in conversation_states:
        initialize_conversation_state(session_id)

    conversation_states[session_id]["collected_data"][step["field"]] = user_response.strip()
    conversation_states[session_id]["last_updated"] = datetime.now().isoformat()

    # Store the conversation pair
    conversation_states[session_id]["conversation_pairs"].append({
        "question": step.get("message", step.get("question", "")),
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

    # Store the user input and advance to next step
    session_id, updated_state, error_message = process_user_input(session_id, user_message)

    # If there was an error, return the error message and stay on the current step
    if error_message:
        current_step = get_step_by_id(current_step_id)
        # Create a more user-friendly error message
        error_response = f"I couldn't process your input: {error_message}\n\nPlease try again. {current_step['message']}"
        return error_response, error_message, False

    # Get the updated step
    current_step_id = updated_state["current_step"]
    current_step = get_step_by_id(current_step_id)

    # Check if conversation is complete (reached analysis step)
    if current_step_id == "analysis":
        # Generate analysis
        collected_data = updated_state["collected_data"]
        conversation_pairs = updated_state["conversation_pairs"]

        # Try to store the investigation data
        try:
            if FINANCE_STORAGE_AVAILABLE:
                case_id = collected_data.get("case_id", f"case_{session_id}")

                # Create user metadata
                user_metadata = {
                    "session_id": session_id,
                    "completion_time": datetime.now().isoformat(),
                    "total_steps": len(CASE_INFO_STEPS),
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

    # Return the next question
    if current_step and current_step["message"]:
        return current_step["message"], None, False
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
        Uses the same structured approach as the AI analysis.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Structured analysis based on the 14-question framework
        """
        # Extract key details from the 14-question structure
        case_id = case_details.get("case_id", "Unknown")
        date_of_incident = case_details.get("date_of_incident", "Unknown date")
        time_of_discovery = case_details.get("time_of_discovery", "Unknown time")
        financial_institution = case_details.get("financial_institution", "Unknown institution")
        victim_name = case_details.get("victim_name", "the victim")
        account_type = case_details.get("account_type", "unknown account type")
        account_number = case_details.get("account_number", "unknown account")
        fraud_type = case_details.get("fraud_type", "unknown fraud type")
        amount_involved = case_details.get("amount_involved", "unknown amount")
        method_used = case_details.get("method_used", "unknown method")
        suspicious_activity = case_details.get("suspicious_activity", "No suspicious activity reported")
        evidence_collected = case_details.get("evidence_collected", "No evidence reported")
        suspects = case_details.get("suspects", "No suspects identified")
        additional_notes = case_details.get("additional_notes", "")

        # Build structured analysis following the 6-section format
        analysis = f"# FINANCIAL FRAUD INVESTIGATION ANALYSIS - CASE {case_id}\n\n"

        # 1. Summary of the Fraud Incident
        analysis += "## 1. Summary of the Fraud Incident\n"
        analysis += f"**Nature of Offense:** {fraud_type}\n"
        analysis += f"**Financial Impact:** {amount_involved}\n"
        analysis += f"**Victim:** {victim_name}\n"
        analysis += f"**Institution:** {financial_institution}\n"
        analysis += f"**Account Type:** {account_type}\n"
        analysis += f"**Incident Date:** {date_of_incident}\n"
        analysis += f"**Discovery Time:** {time_of_discovery}\n\n"

        analysis += f"This case involves {fraud_type} targeting {victim_name}'s {account_type} "
        analysis += f"at {financial_institution}, resulting in financial losses of {amount_involved}. "
        analysis += f"The fraud occurred on {date_of_incident} and was discovered at {time_of_discovery}.\n\n"

        # 2. Timeline and System Access Reconstruction
        analysis += "## 2. Timeline and System Access Reconstruction\n"
        analysis += f"**Incident Timeline:** {date_of_incident}\n"
        analysis += f"**Discovery Timeline:** {time_of_discovery}\n"
        analysis += f"**Method of Access:** {method_used}\n"
        analysis += f"**Suspicious Activity Patterns:** {suspicious_activity}\n\n"

        if date_of_incident != "Unknown date" and time_of_discovery != "Unknown time":
            analysis += "The timeline shows a gap between the incident occurrence and discovery, "
            analysis += "which may indicate delayed detection systems or sophisticated concealment methods.\n\n"

        # 3. Suspect and Method Analysis
        analysis += "## 3. Suspect and Method Analysis\n"
        analysis += f"**Current Suspect Status:** {suspects}\n"
        analysis += f"**Method Used:** {method_used}\n"
        analysis += f"**Technical Approach:** Based on the {method_used}, this suggests "

        if "phishing" in method_used.lower():
            analysis += "social engineering tactics and email-based deception.\n"
        elif "malware" in method_used.lower():
            analysis += "sophisticated technical knowledge and system infiltration capabilities.\n"
        elif "insider" in method_used.lower():
            analysis += "internal access and knowledge of institutional procedures.\n"
        else:
            analysis += "a methodical approach requiring planning and system knowledge.\n"

        analysis += "\n"

        # 4. Evidence Correlation
        analysis += "## 4. Evidence Correlation\n"
        analysis += f"**Available Evidence:** {evidence_collected}\n"
        analysis += f"**Account Information:** {account_number} ({account_type})\n"
        analysis += f"**Suspicious Activity Indicators:** {suspicious_activity}\n\n"

        if evidence_collected != "No evidence reported":
            analysis += "The collected evidence should be analyzed for:\n"
            analysis += "- Digital footprints and IP address tracking\n"
            analysis += "- Transaction metadata and timestamps\n"
            analysis += "- Communication records and access logs\n"
            analysis += "- Device fingerprinting and authentication records\n\n"

        # 5. Recommended Investigative Steps
        analysis += "## 5. Recommended Investigative Steps\n"
        analysis += "**Immediate Actions:**\n"
        analysis += f"- Secure and freeze affected {account_type} accounts\n"
        analysis += "- Preserve all digital evidence and transaction logs\n"
        analysis += f"- Coordinate with {financial_institution} security team\n"
        analysis += "- Implement account monitoring and alerts\n\n"

        analysis += "**Forensic Analysis:**\n"
        analysis += "- Conduct detailed transaction flow analysis\n"
        analysis += "- Perform IP address and device tracking\n"
        analysis += "- Analyze authentication and access patterns\n"
        analysis += "- Review security camera footage if applicable\n\n"

        analysis += "**Recovery and Legal Actions:**\n"
        analysis += "- File reports with appropriate financial crime units\n"
        analysis += "- Initiate fund recovery procedures\n"
        analysis += "- Coordinate with other affected institutions\n"
        analysis += "- Prepare documentation for legal proceedings\n\n"

        # 6. Probability-Based Conclusions
        analysis += "## 6. Probability-Based Conclusions\n"

        if suspects != "No suspects identified":
            analysis += f"**Suspect Likelihood:** Based on available information about {suspects}, "
            analysis += "further investigation is warranted to establish means, motive, and opportunity.\n\n"

        if amount_involved != "unknown amount":
            analysis += f"**Recovery Prospects:** Given the {amount_involved} involved and the "
            analysis += f"{method_used}, recovery efforts should focus on rapid response and "
            analysis += "institutional cooperation.\n\n"

        analysis += f"**Risk Assessment:** The use of {method_used} suggests "
        if "sophisticated" in method_used.lower() or "advanced" in method_used.lower():
            analysis += "a high-skill perpetrator with potential for repeat offenses.\n"
        else:
            analysis += "standard fraud techniques that may be part of broader criminal patterns.\n"

        analysis += "\n"

        if additional_notes:
            analysis += f"**Additional Considerations:** {additional_notes}\n\n"

        analysis += "---\n"
        analysis += "*This analysis is based on the provided case details and follows standard financial fraud investigation protocols. "
        analysis += "All conclusions are preliminary and subject to further investigation and evidence analysis.*"

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
        prompt = "Analyze the following financial fraud case and provide insights and solutions based ONLY on the data provided:\n\nEach input field in this case has been designed to gather essential facts critical for resolving financial fraud incidents. Your analysis should treat each answer with the following contextual importance:\n1. Case ID: A unique identifier used to track, cross-reference, and audit the case. It acts as the primary key for storing and retrieving associated data. Always link findings to this identifier.\n2. Date of Incident: Establishes when the fraud was committed. This is crucial for narrowing transaction windows, identifying vulnerable system periods, and correlating activity across financial networks.\n3. Time of Discovery: Distinguishes between the crime window and detection window. Critical for response timing, identifying gaps in security protocols, and calculating potential damage spread.\n4. Financial Institution: The involved institution informs about the type of systems compromised, internal security protocols, jurisdiction, and regulatory framework.\n5. Victim Name: Helps in identity tracing, asset linkage, and motive analysis. Corporate victims may require different investigative frameworks than individual ones.\n6. Account Type: Indicates the nature of access or privileges potentially exploited. For example, investment frauds differ in approach and traceability compared to credit card thefts.\n7. Account Number (partial): Enables secure referencing without full exposure. Use for linking logs, transaction IDs, or inter-system tracking while preserving confidentiality.\n8. Fraud Type: Identifies the primary category of offense (e.g., wire fraud, identity theft, phishing). Each has distinct behavioral, technical, and procedural markers.\n9. Amount Involved: Quantifies the scale of the fraud. Larger amounts typically signal sophisticated planning, multi-party coordination, or internal compromise.\n10. Method Used: Reveals the technical or procedural approach of the fraudster. This is crucial for pattern recognition, signature analysis, and cybersecurity posture review.\n11. Suspicious Activity: Patterns such as unusual logins, ATM locations, or login time anomalies help in behavioral profiling and anomaly detection.\n12. Evidence Collected: All tangible or digital evidence (e.g., IP logs, transaction metadata, forged documents) should be mapped to the fraud timeline and actors involved.\n13. Suspect Information: If suspects are known, analyze their role, means, and motive. Prioritize connection to transaction data, prior offenses, or insider access.\n14. Additional Notes: This may include narrative context, preliminary theories, intuition from investigators, or edge-case details that need expert review.\nYou must weigh each factor proportionally. For example, a suspect with insider access combined with sophisticated technical methods and large amounts could suggest coordinated internal fraud. Your insights must strive for maximum accuracy, taking logical steps only grounded in the input data. Do not speculate beyond the provided facts.\nYou must prioritize:\n- Alignment between transaction data, fraud timelines, and access logs.\n- Presence of premeditation or systemic vulnerability.\n- Traceability of funds, digital footprints, and suspect access.\n- Legal and procedural next steps to contain damage and pursue recovery.\nStructure your final output with:\n1. Summary of the Fraud Incident\n2. Timeline and System Access Reconstruction\n3. Suspect and Method Analysis\n4. Evidence Correlation\n5. Recommended Investigative Steps\n6. Probability-Based Conclusions (only if supported by data)\nRemember: this analysis will support legal documentation, recovery efforts, and institutional risk assessments. Maximize factual coherence, logic, and compliance-oriented recommendations. Minimize assumptions. Do not exceed the facts presented.\nBegin analysis below."

        # Add case details
        for key, value in case_details.items():
            if value and str(value).strip():
                formatted_key = key.replace('_', ' ').title()
                prompt += f"\n**{formatted_key}:** {value}"

        return prompt
