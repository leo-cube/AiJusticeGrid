#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Murder Agent Backend - Improved Implementation

This is a completely new implementation of the Murder Agent backend with
improved conversation state management and proper handling of user inputs.

Usage:
    python murder_agent_backend.py

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("murder_agent_backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
ENV_FILE = ".env"
API_KEY_VAR = "NVIDIA_API_KEY"
MODEL_NAME = "nvidia/llama-3.1-nemotron-ultra-253b-v1"
PORT = 5001  # Using a different port to avoid conflicts with the unified server

# Dictionary to store conversation states
# Format: {session_id: {current_step: step_name, collected_data: {field: value}, last_updated: timestamp}}
conversation_states = {}

# Define the case information collection steps
CASE_INFO_STEPS = [
    {
        "id": "greeting",
        "message": "Hello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. I'll help you analyze a murder case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
        "field": "case_id",  # Now stores the very first reply
        "next_step": "date_of_crime",  # Skip directly to date_of_crime
        "validation": None
    },
    # The old case_id step is kept for backward compatibility but no longer used in the normal flow
    {
        "id": "case_id",
        "message": "Thank you. When did the crime occur? Please provide the date (YYYY-MM-DD, MM/DD/YYYY, or text format like 'January 15, 2023').",
        "field": "case_id",
        "next_step": "date_of_crime",
        "validation": None
    },
    {
        "id": "date_of_crime",
        "message": "Thank you. When did the crime occur? Please provide the date (YYYY-MM-DD, MM/DD/YYYY, or text format like 'January 15, 2023').",
        "field": "date_of_crime",
        "next_step": "time_of_crime",
        "validation": "date"
    },
    {
        "id": "time_of_crime",
        "message": "What time did the crime occur? (HH:MM format, or approximate time like '2:30 PM', 'noon', or 'evening')",
        "field": "time_of_crime",
        "next_step": "location",
        "validation": "time"
    },
    {
        "id": "location",
        "message": "Where did the crime take place? Please provide the location.",
        "field": "location",
        "next_step": "victim_name",
        "validation": None  # No validation for location input
    },
    {
        "id": "victim_name",
        "message": "What is the victim's name?",
        "field": "victim_name",
        "next_step": "victim_age",
        "validation": None
    },
    {
        "id": "victim_age",
        "message": "What is the victim's age?",
        "field": "victim_age",
        "next_step": "victim_gender",
        "validation": "age"
    },
    {
        "id": "victim_gender",
        "message": "What is the victim's gender?",
        "field": "victim_gender",
        "next_step": "cause_of_death",
        "validation": None
    },
    {
        "id": "cause_of_death",
        "message": "What was the cause of death?",
        "field": "cause_of_death",
        "next_step": "weapon_used",
        "validation": None
    },
    {
        "id": "weapon_used",
        "message": "Was a weapon used? If so, what kind?",
        "field": "weapon_used",
        "next_step": "crime_scene_description",
        "validation": None
    },
    {
        "id": "crime_scene_description",
        "message": "Please describe the crime scene.",
        "field": "crime_scene_description",
        "next_step": "witnesses",
        "validation": None
    },
    {
        "id": "witnesses",
        "message": "Were there any witnesses? If so, please provide details.",
        "field": "witnesses",
        "next_step": "evidence_found",
        "validation": None
    },
    {
        "id": "evidence_found",
        "message": "What evidence was found at the scene?",
        "field": "evidence_found",
        "next_step": "suspects",
        "validation": None
    },
    {
        "id": "suspects",
        "message": "Are there any suspects at this time?",
        "field": "suspects",
        "next_step": "additional_notes",
        "validation": None
    },
    {
        "id": "additional_notes",
        "message": "Do you have any additional notes or information about the case?",
        "field": "additional_notes",
        "next_step": "analysis",
        "validation": None
    },
    {
        "id": "analysis",
        "message": "Thank you for providing all the case details. I'll now analyze this information and provide you with a comprehensive report.",
        "field": None,
        "next_step": None,
        "validation": None
    }
]

# Define the correct field names for storing data
FIELD_NAMES = {
    "case_id": "case_id",
    "date_of_crime": "date_of_crime",
    "time_of_crime": "time_of_crime",
    "location": "location",
    "victim_name": "victim_name",
    "victim_age": "victim_age",
    "victim_gender": "victim_gender",
    "cause_of_death": "cause_of_death",
    "weapon_used": "weapon_used",
    "crime_scene_description": "crime_scene_description",
    "witnesses": "witnesses",
    "evidence_found": "evidence_found",
    "suspects": "suspects",
    "additional_notes": "additional_notes"
}

def retrieve_api_key() -> Optional[str]:
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

# Get API key from environment variables or .env file
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY')
if not NVIDIA_API_KEY:
    # Try to get API key from .env file
    NVIDIA_API_KEY = retrieve_api_key()
    if NVIDIA_API_KEY:
        logger.info(f"Using API key from {ENV_FILE} file")
    else:
        logger.warning("NVIDIA_API_KEY not found in environment variables or .env file. Using default value.")
        NVIDIA_API_KEY = "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"

# Helper function to get step by ID
def get_step_by_id(step_id: str) -> Optional[Dict[str, Any]]:
    """Get a step by its ID."""
    for step in CASE_INFO_STEPS:
        if step["id"] == step_id:
            return step
    return None

# Helper function to get the next step
def get_next_step(current_step_id: str) -> Optional[Dict[str, Any]]:
    """Get the next step after the current step."""
    current_step = get_step_by_id(current_step_id)
    if current_step and current_step["next_step"]:
        return get_step_by_id(current_step["next_step"])
    return None

# Helper function to create a new conversation state
def create_new_conversation_state() -> str:
    """Create a new conversation state with a unique session ID."""
    # Generate a new session ID
    session_id = str(uuid.uuid4())

    # Create a new conversation state
    conversation_states[session_id] = {
        "current_step": "greeting",
        "collected_data": {},
        "last_updated": datetime.now().isoformat()
    }

    # Log the creation
    logger.info(f"Created new conversation state with session ID: {session_id}")
    logger.info(f"New conversation state: {conversation_states[session_id]}")

    return session_id

# Helper function to validate user input
def validate_input(input_value: str, validation_type: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate user input based on the validation type.

    Args:
        input_value: The user input to validate
        validation_type: The type of validation to perform

    Returns:
        Tuple of (is_valid, formatted_value_or_error_message)
        If is_valid is True and formatted_value_or_error_message is not None,
        it contains the standardized format of the input.
        If is_valid is False, it contains an error message.
    """
    if not validation_type:
        return True, None

    if validation_type == "date":
        # Trim any extra whitespace
        input_value = input_value.strip()

        # Handle text date formats like "January 15, 2023" or "15 Jan 2023"
        month_names = {
            "january": "01", "jan": "01",
            "february": "02", "feb": "02",
            "march": "03", "mar": "03",
            "april": "04", "apr": "04",
            "may": "05",
            "june": "06", "jun": "06",
            "july": "07", "jul": "07",
            "august": "08", "aug": "08",
            "september": "09", "sep": "09",
            "october": "10", "oct": "10",
            "november": "11", "nov": "11",
            "december": "12", "dec": "12"
        }

        # Try to extract date from text format
        text_date_pattern = r'(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-zA-Z]+)(?:,?\s+)(\d{4})'
        text_date_match = re.search(text_date_pattern, input_value)
        if text_date_match:
            day, month_text, year = text_date_match.groups()
            month_text = month_text.lower()
            if month_text in month_names:
                month = month_names[month_text]
                return True, f"{year}-{month}-{day.zfill(2)}"

        # Also try "Month day, year" format
        alt_text_pattern = r'([a-zA-Z]+)(?:\s+)(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+)(\d{4})'
        alt_text_match = re.search(alt_text_pattern, input_value)
        if alt_text_match:
            month_text, day, year = alt_text_match.groups()
            month_text = month_text.lower()
            if month_text in month_names:
                month = month_names[month_text]
                return True, f"{year}-{month}-{day.zfill(2)}"

        # Check if the input is a valid date in YYYY-MM-DD format
        date_pattern = r'^\d{4}-\d{1,2}-\d{1,2}$'
        if re.match(date_pattern, input_value):
            # Already in the correct format, just validate and standardize
            try:
                year, month, day = input_value.split('-')
                # Ensure month and day are valid
                month_int = int(month)
                day_int = int(day)
                if not (1 <= month_int <= 12 and 1 <= day_int <= 31):
                    return False, "Please provide a valid date with month between 1-12 and day between 1-31."
                # Return standardized format with leading zeros
                return True, f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            except ValueError:
                return False, "Please provide a valid date in YYYY-MM-DD format."

        # Handle other common date formats
        alt_patterns = [
            (r'^\d{1,2}/\d{1,2}/\d{4}$', '/', False),  # MM/DD/YYYY
            (r'^\d{1,2}-\d{1,2}-\d{4}$', '-', False),  # MM-DD-YYYY
            (r'^\d{1,2}\.\d{1,2}\.\d{4}$', '.', False),  # MM.DD.YYYY
            (r'^\d{4}/\d{1,2}/\d{1,2}$', '/', True),  # YYYY/MM/DD
            (r'^\d{1,2}/\d{1,2}/\d{2}$', '/', False)   # MM/DD/YY
        ]

        for pattern_tuple in alt_patterns:
            pattern, separator, year_first = pattern_tuple
            if re.match(pattern, input_value):
                try:
                    parts = input_value.split(separator)
                    if len(parts) == 3:
                        if year_first:
                            year, month, day = parts
                        else:
                            month, day, year = parts
                            # Handle 2-digit years
                            if len(year) == 2:
                                current_year = datetime.now().year
                                century = current_year // 100
                                year_int = int(year)
                                # If the 2-digit year is greater than current year's last 2 digits,
                                # assume it's from the previous century
                                if year_int > current_year % 100:
                                    year = f"{century-1}{year}"
                                else:
                                    year = f"{century}{year}"

                        # Validate month and day
                        month_int = int(month)
                        day_int = int(day)
                        if not (1 <= month_int <= 12 and 1 <= day_int <= 31):
                            return False, "Please provide a valid date with month between 1-12 and day between 1-31."

                        # Return standardized format
                        return True, f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                except Exception as e:
                    logger.error(f"Error converting date format: {str(e)}")
                    continue

        # If we've reached here, no valid format was found
        return False, "Please provide a valid date in YYYY-MM-DD format. Examples: 2023-05-15, 05/15/2023, May 15, 2023."

    elif validation_type == "time":
        # Trim any extra whitespace
        input_value = input_value.strip().lower()

        # Handle standard time formats (HH:MM)
        time_pattern = r'^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$'
        time_match = re.match(time_pattern, input_value)

        if time_match:
            hour, minute, ampm = time_match.groups()
            hour_int = int(hour)

            # Convert to 24-hour format if AM/PM is specified
            if ampm:
                if ampm.lower() == 'pm' and hour_int < 12:
                    hour_int += 12
                elif ampm.lower() == 'am' and hour_int == 12:
                    hour_int = 0

            # Validate hour and minute
            if not (0 <= hour_int <= 23):
                return False, "Please provide a valid hour between 0-23 (or 1-12 with AM/PM)."

            if not (0 <= int(minute) <= 59):
                return False, "Please provide a valid minute between 0-59."

            # Return standardized format
            return True, f"{hour_int:02d}:{minute}"

        # Handle hour only with AM/PM
        hour_pattern = r'^(\d{1,2})\s*(am|pm)$'
        hour_match = re.match(hour_pattern, input_value)

        if hour_match:
            hour, ampm = hour_match.groups()
            hour_int = int(hour)

            # Convert to 24-hour format
            if ampm.lower() == 'pm' and hour_int < 12:
                hour_int += 12
            elif ampm.lower() == 'am' and hour_int == 12:
                hour_int = 0

            # Validate hour
            if not (0 <= hour_int <= 23):
                return False, "Please provide a valid hour between 0-23 (or 1-12 with AM/PM)."

            # Return standardized format with 00 minutes
            return True, f"{hour_int:02d}:00"

        # Handle descriptive time formats
        descriptive_times = {
            "midnight": "00:00",
            "noon": "12:00",
            "morning": "09:00",
            "afternoon": "15:00",
            "evening": "19:00",
            "night": "22:00"
        }

        for desc, time_value in descriptive_times.items():
            if desc in input_value:
                return True, time_value

        # If we've reached here, no valid format was found
        return False, "Please provide a valid time in HH:MM format, or with AM/PM. Examples: 14:30, 2:30 PM, noon."

    elif validation_type == "age":
        # Trim any extra whitespace
        input_value = input_value.strip()

        # Extract numeric age from text
        age_pattern = r'(\d+)'
        age_match = re.search(age_pattern, input_value)

        if age_match:
            age = age_match.group(1)
            age_int = int(age)

            # Validate age is reasonable
            if not (0 <= age_int <= 120):
                return False, "Please provide a valid age between 0-120 years."

            # Return standardized format
            return True, str(age_int)

        # If we've reached here, no valid format was found
        return False, "Please provide a valid numeric age. Example: 35."

    # Add more validation types as needed

    return True, None

# Helper function to store user input in the conversation state
def store_user_input(session_id: str, step_id: str, user_input: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Store user input in the conversation state.

    Args:
        session_id: The session ID
        step_id: The current step ID
        user_input: The user input to store

    Returns:
        Tuple of (success, error_message, formatted_input)
    """
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found in conversation states")
        return False, "Session not found", None

    # Get the current step
    current_step = get_step_by_id(step_id)
    if not current_step:
        logger.error(f"Step ID {step_id} not found in CASE_INFO_STEPS")
        return False, "Invalid step", None

    # Validate the input if this step has validation
    formatted_input = user_input
    if current_step["validation"]:
        is_valid, validation_result = validate_input(user_input, current_step["validation"])
        if not is_valid:
            logger.info(f"Validation failed for input: {user_input} with validation type: {current_step['validation']}")
            return False, validation_result, None

        # If validation returned a formatted value, use it
        if validation_result:
            formatted_input = validation_result

    # Store the user input if this step has a field
    if current_step["field"]:
        # Get the correct field name for storing the data
        field_name = FIELD_NAMES.get(current_step["field"], current_step["field"])

        # Store the user input in the correct field
        conversation_states[session_id]["collected_data"][field_name] = formatted_input
        logger.info(f"Stored user input in field {field_name}: {formatted_input}")

    return True, None, formatted_input

# Helper function to advance to the next step
def advance_to_next_step(session_id: str, current_step_id: str) -> bool:
    """Advance to the next step in the conversation."""
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found in conversation states")
        return False

    # Get the current step
    current_step = get_step_by_id(current_step_id)
    if not current_step:
        logger.error(f"Step ID {current_step_id} not found in CASE_INFO_STEPS")
        return False

    # Move to the next step if there is one
    if current_step["next_step"]:
        next_step_id = current_step["next_step"]
        conversation_states[session_id]["current_step"] = next_step_id
        logger.info(f"Advanced to next step: {next_step_id}")

        # Update the last updated timestamp
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()

        return True

    return False

# Helper function to process user input and update conversation state
def process_user_input(session_id: str, user_input: str) -> Tuple[str, Dict[str, Any], Optional[str]]:
    """
    Process user input and update the conversation state.

    Args:
        session_id: The session ID
        user_input: The user input to process

    Returns:
        Tuple of (session_id, updated_state, error_message)
    """
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found in conversation states")
        # Create a new session if the session ID doesn't exist
        new_session_id = create_new_conversation_state()
        logger.info(f"Created new session {new_session_id} for non-existent session {session_id}")
        return new_session_id, conversation_states[new_session_id], None

    # Get the current conversation state
    conv_state = conversation_states[session_id]
    current_step_id = conv_state["current_step"]

    # Log the current state and user input
    logger.info(f"Processing user input for session {session_id}, step {current_step_id}: {user_input}")
    logger.info(f"Current conversation state: {conv_state}")

    # Store the user input
    success, error_message, formatted_input = store_user_input(session_id, current_step_id, user_input)

    if not success:
        logger.error(f"Failed to store user input: {user_input}, error: {error_message}")
        return session_id, conv_state, error_message  # Return the current state and error message

    # Advance to the next step if storage was successful
    advance_result = advance_to_next_step(session_id, current_step_id)
    if not advance_result:
        logger.error(f"Failed to advance to next step from {current_step_id}")
        # This is not a fatal error, so we continue

    # Return the updated conversation state
    return session_id, conversation_states[session_id], None

class MurderAgent:
    """
    Main interface for the Murder Agent that analyzes murder cases using the NVIDIA API.
    """

    def __init__(self, api_key: str):
        """
        Initialize the Murder Agent.

        Args:
            api_key: NVIDIA API key
        """
        self.api_key = api_key
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        logger.info(f"Murder Agent initialized with model: {MODEL_NAME}")

    def analyze_case(self, case_details: Dict[str, Any]) -> str:
        """
        Analyze a murder case using the NVIDIA model.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Analysis and solutions for the case
        """
        logger.info("Analyzing case with Murder Agent")

        # Format the case details into a prompt
        prompt = self._format_case_prompt(case_details)

        try:
            # Call the NVIDIA API with the real API key
            logger.info("Calling NVIDIA API for murder analysis")

            system_prompt = "You are a Murder Agent, an AI assistant specialized in analyzing and solving murder cases. Provide detailed analysis, insights, and investigative approaches based solely on the case details provided. Focus on the specific information given and avoid making assumptions beyond what's in the data."

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
            logger.error(f"Error analyzing case with Murder Agent: {str(e)}")
            return f"Error analyzing case: {str(e)}"

    def _format_case_prompt(self, case_details: Dict[str, Any]) -> str:
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
            prompt = f"As a Murder Investigation AI Agent specialized in homicide investigations and forensic analysis, please answer the following question:\n\n{question}\n\n"

            if "additional_notes" in case_details and case_details["additional_notes"]:
                prompt += f"Additional context: {case_details['additional_notes']}\n\n"

            prompt += "Provide a detailed, evidence-based response using your expertise in forensic science, criminal psychology, and investigative techniques."
            return prompt

        # Regular case analysis
        prompt = "Analyze the following murder case and provide insights and solutions based ONLY on the data provided:\n\n"

        for key, value in case_details.items():
            if value and key != "question":  # Skip the question field if present
                prompt += f"{key.replace('_', ' ').title()}: {value}\n"

        prompt += "\n\nBased on these specific details, please provide:\n"
        prompt += "1. A comprehensive analysis of the case\n"
        prompt += "2. Potential motives and suspects to consider based on the evidence\n"
        prompt += "3. Recommended investigative approaches specific to this case\n"
        prompt += "4. Key evidence to focus on and how to analyze it\n"
        prompt += "5. Possible solutions or conclusions that follow directly from the data\n"
        prompt += "\nImportant: Base your analysis ONLY on the information provided in this case. Do not use generic templates or assumptions not supported by the data."

        return prompt

    def process_message(self, message: str, session_id: Optional[str] = None, force_new_session: bool = False) -> Tuple[str, str, bool, str, Optional[str]]:
        """
        Process a message from the user and update the conversation state.

        Args:
            message: The user's message
            session_id: Optional session ID for continuing a conversation
            force_new_session: Force creation of a new session regardless of existing session

        Returns:
            Tuple of (session_id, response_message, is_collecting_info, current_step, error_message)
        """
        logger.info(f"Processing message: {message} with session_id: {session_id}")
        logger.info(f"force_new_session: {force_new_session}")

        # Check for special commands or flags
        if message and message.lower() in ["reset", "restart", "start over"] or message == "FORCE_NEW_SESSION" or force_new_session:
            logger.info(f"Reset command detected or force_new_session is True: {message}")
            if session_id and session_id in conversation_states:
                logger.info(f"Deleting conversation state for session {session_id}")
                del conversation_states[session_id]

            # Create a new conversation state
            session_id = create_new_conversation_state()
            current_step = get_step_by_id("greeting")

            # Return the greeting message
            return session_id, current_step["message"], True, "greeting", None

        # Create a new session if none exists
        if not session_id or session_id not in conversation_states:
            logger.info(f"Creating new session (old session_id: {session_id})")
            session_id = create_new_conversation_state()
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

        # If this is the first message and there's no message, just return the greeting
        if current_step_id == "greeting" and not message:
            logger.info("No message provided for greeting, returning greeting message")
            return session_id, get_step_by_id("greeting")["message"], True, "greeting", None

        # For all other cases, we'll process the input normally through the standard flow
        # The greeting step now has field="case_id", so the first input will be stored correctly

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

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the Murder Agent
murder_agent = MurderAgent(NVIDIA_API_KEY)
logger.info("Murder Agent initialized")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "agent": "murder"})

@app.route('/api/augment/murder', methods=['POST'])
def murder_agent_endpoint():
    """Murder Agent API endpoint."""
    logger.info("Received request for Murder Agent")

    # Get case details from request
    case_details = request.json
    if not case_details:
        return jsonify({
            "success": False,
            "error": "No case details provided",
            "data": {
                "analysis": "No case details provided. Please provide case details."
            }
        }), 400

    # Check if this is just a ping/health check
    if case_details.get("question") == "ping":
        return jsonify({
            "success": True,
            "data": {
                "analysis": "Murder Agent is running"
            },
            "status": "healthy"
        }), 200

    # Get the session ID and user input from the request
    session_id = case_details.get("session_id")
    user_input = case_details.get("question", "")
    force_new_session = case_details.get("forceReset", False)

    # Check if case_id is explicitly provided in the request
    explicit_case_id = case_details.get("case_id")
    if explicit_case_id:
        logger.info(f"Explicit case_id provided in request: {explicit_case_id}")

    logger.info(f"Received request with session_id: {session_id}, user_input: {user_input}")
    logger.info(f"force_new_session: {force_new_session}")
    logger.info(f"Full case details: {case_details}")

    # Check if this is a new session or the first message
    is_new_session = not session_id or session_id not in conversation_states
    if is_new_session:
        logger.info("This is a new session or the first message")

        # Create a new session if needed
        if not session_id or session_id not in conversation_states:
            session_id = create_new_conversation_state()
            logger.info(f"Created new session: {session_id}")

        # If this is the first message and it's not a special command, store it as the case ID
        if user_input and user_input not in ["FORCE_NEW_SESSION", "CONTINUE_ANALYSIS", "reset", "restart", "start over"]:
            logger.info(f"First message detected: {user_input}, storing as case ID")
            conversation_states[session_id]["collected_data"]["case_id"] = user_input
            logger.info(f"Stored case ID: {user_input}")
            logger.info(f"Updated conversation state: {conversation_states[session_id]}")

    # If this is the first message and we're creating a new session, store the case ID before processing
    if is_new_session and user_input and user_input not in ["FORCE_NEW_SESSION", "CONTINUE_ANALYSIS", "reset", "restart", "start over"]:
        logger.info(f"First message detected before processing: {user_input}, storing as case ID")
        conversation_states[session_id]["collected_data"]["case_id"] = user_input
        logger.info(f"Stored case ID before processing: {user_input}")
        logger.info(f"Updated conversation state before processing: {conversation_states[session_id]}")

        # Also advance to the next step (date_of_crime) to ensure proper flow
        conversation_states[session_id]["current_step"] = "date_of_crime"
        logger.info(f"Advanced to step before processing: date_of_crime")

    # Process the message using the process_message method
    # The greeting step now has field="case_id", so the first input will be stored correctly
    session_id, response, is_collecting_info, current_step, error_message = murder_agent.process_message(
        user_input,
        session_id,
        force_new_session=force_new_session
    )

    # Get the collected data from the conversation state
    collected_data = conversation_states[session_id]["collected_data"] if session_id in conversation_states else {}
    logger.info(f"Collected data from conversation state: {collected_data}")
    logger.info(f"Current step: {current_step}")

    # With our changes to the greeting step, this should no longer be necessary,
    # but we'll keep a simplified safety check just in case
    if is_new_session and user_input and not collected_data.get("case_id"):
        logger.info(f"Safety check: Adding case ID to collected data: {user_input}")
        collected_data["case_id"] = user_input
        conversation_states[session_id]["collected_data"]["case_id"] = user_input

    # Return the response with the session ID and conversation state
    response_data = {
        "success": True,
        "data": {
            "analysis": response,
            "is_collecting_info": is_collecting_info,
            "current_step": current_step,
            "collected_data": collected_data,
            "error": error_message
        },
        "session_id": session_id,
        "message": "Message processed successfully"
    }

    # Log the final response data for debugging
    logger.info(f"Final collected data in response: {collected_data}")

    logger.info(f"Sending response: {response_data}")
    return jsonify(response_data)

@app.route('/api/augment/murder/state', methods=['GET'])
def murder_agent_state():
    """Get the current conversation state for a session."""
    session_id = request.args.get('session_id')

    if not session_id or session_id not in conversation_states:
        return jsonify({
            "success": False,
            "error": "Invalid or missing session ID",
            "data": {
                "analysis": "No active conversation found. Please start a new conversation."
            }
        }), 400

    # Get the conversation state
    conv_state = conversation_states[session_id]
    current_step_id = conv_state["current_step"]
    current_step = get_step_by_id(current_step_id)

    return jsonify({
        "success": True,
        "data": {
            "current_step": current_step_id,
            "current_step_message": current_step["message"] if current_step else None,
            "collected_data": conv_state["collected_data"],
            "last_updated": conv_state["last_updated"]
        },
        "session_id": session_id,
        "message": "Conversation state retrieved successfully"
    })

@app.route('/api/augment/murder/reset', methods=['POST'])
def murder_agent_reset():
    """Reset a conversation."""
    session_id = request.json.get('session_id')

    if not session_id or session_id not in conversation_states:
        return jsonify({
            "success": False,
            "error": "Invalid or missing session ID",
            "data": {
                "analysis": "No active conversation found. Please start a new conversation."
            }
        }), 400

    logger.info(f"Resetting conversation for session {session_id}")

    # Delete the conversation state
    del conversation_states[session_id]

    # Create a new conversation state
    new_session_id = create_new_conversation_state()
    new_conv_state = conversation_states[new_session_id]
    current_step = get_step_by_id(new_conv_state["current_step"])

    logger.info(f"Created new conversation with session ID: {new_session_id}")

    return jsonify({
        "success": True,
        "data": {
            "analysis": current_step["message"],
            "is_collecting_info": True,
            "current_step": new_conv_state["current_step"]
        },
        "session_id": new_session_id,
        "message": "Conversation reset successfully"
    })

def run_server():
    """Run the Murder Agent backend server."""
    logger.info(f"Starting Murder Agent backend server on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)

if __name__ == "__main__":
    run_server()
