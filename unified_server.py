#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Unified Agent Server - Improved Implementation

This is an enhanced version of the unified server with improved conversation flow
and error handling for the Murder Agent and other agents.
"""

import os
import logging
import uuid
import json
import time
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List

from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

# --- Configuration ---
PROJECT_ROOT = Path(__file__).parent.absolute()

# Path configuration
PATHS = {
    'env_file': PROJECT_ROOT / '.env',
    'log_file': PROJECT_ROOT / 'unified_agent_server.log',
    'data_dir': PROJECT_ROOT / 'data',
    'templates_dir': PROJECT_ROOT / 'templates',
    'murder_storage': PROJECT_ROOT / 'murder_investigation.json',
    'finance_storage': PROJECT_ROOT / 'finance_investigation.json',
    'saved_reports': PROJECT_ROOT / 'data' / 'saved-reports.json',
    'agent_settings': PROJECT_ROOT / 'data' / 'agent-settings.json'
}

# Ensure data directory exists
PATHS['data_dir'].mkdir(exist_ok=True)

# Load environment variables
load_dotenv(PATHS['env_file'])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(PATHS['log_file']),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# --- Constants ---
API_KEY_VAR = "NVIDIA_API_KEY"
MURDER_MODEL_NAME = "nvidia/llama-3.1-nemotron-ultra-253b-v1"
MAIN_PORT = int(os.getenv("PORT", 5000))

# --- Global State ---
conversation_states = {}  # Format: {session_id: {current_step: str, collected_data: dict, last_updated: str}}
analysis_in_progress = {}  # Track ongoing analyses

# --- Conversation Flow Definition ---
CASE_INFO_STEPS = [
    {
        "id": "greeting",
        "message": "Hello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. I'll help you analyze a murder case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
        "field": "case_id",
        "next_step": "date_of_crime",
        "validation": None
    },
    {
        "id": "date_of_crime",
        "message": "When did the crime occur? Please provide the date (YYYY-MM-DD, MM/DD/YYYY, or text format like 'January 15, 2023').",
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
        "validation": None
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
        "message": "Would you like me to analyze the case now? (yes/no)",
        "field": "request_analysis",
        "next_step": None,
        "validation": None
    }
]

# --- Helper Functions ---

def get_step_by_id(step_id: str) -> Optional[Dict[str, Any]]:
    """Get a step by its ID."""
    for step in CASE_INFO_STEPS:
        if step["id"] == step_id:
            return step
    return None

def get_next_step(current_step_id: str) -> Optional[Dict[str, Any]]:
    """Get the next step after the current step."""
    current_step = get_step_by_id(current_step_id)
    if not current_step or not current_step.get("next_step"):
        return None
    return get_step_by_id(current_step["next_step"])

def create_new_conversation_state() -> str:
    """Create a new conversation state with a unique session ID."""
    session_id = str(uuid.uuid4())
    conversation_states[session_id] = {
        "current_step": "greeting",
        "collected_data": {},
        "last_updated": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat()
    }
    logger.info(f"Created new conversation state with ID: {session_id}")
    return session_id

def validate_input(input_value: str, validation_type: Optional[str]) -> Tuple[bool, Any]:
    """
    Validate user input based on the validation type.
    
    Args:
        input_value: The user input to validate
        validation_type: The type of validation to perform (date, time, age, etc.)
        
    Returns:
        Tuple of (is_valid, formatted_value_or_error_message)
    """
    if not input_value or not input_value.strip():
        return False, "Input cannot be empty"
        
    input_value = input_value.strip()
    
    if not validation_type:
        return True, input_value
        
    if validation_type == "date":
        # Simple date validation (can be enhanced with dateutil.parser for better parsing)
        date_formats = ["%Y-%m-%d", "%m/%d/%Y", "%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y"]
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(input_value, fmt)
                return True, parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return False, "Please enter a valid date (e.g., YYYY-MM-DD, MM/DD/YYYY, or 'January 15, 2023')"
        
    elif validation_type == "time":
        # Simple time validation
        time_formats = ["%H:%M", "%I:%M %p", "%I %p"]
        for fmt in time_formats:
            try:
                parsed_time = datetime.strptime(input_value, fmt)
                return True, parsed_time.strftime("%H:%M")
            except ValueError:
                continue
        return False, "Please enter a valid time (e.g., 14:30, 2:30 PM, or 'noon')"
        
    elif validation_type == "age":
        try:
            age = int(input_value)
            if 0 <= age <= 150:
                return True, str(age)
            return False, "Please enter a valid age between 0 and 150"
        except ValueError:
            return False, "Please enter a valid number for age"
            
    return True, input_value

def store_user_input(session_id: str, step_id: str, user_input: str) -> Tuple[bool, Optional[str], Any]:
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
        return False, "Invalid session ID", None
        
    step = get_step_by_id(step_id)
    if not step:
        return False, f"Invalid step ID: {step_id}", None
        
    # Validate input if validation is specified
    validation_type = step.get("validation")
    is_valid, validation_result = validate_input(user_input, validation_type)
    
    if not is_valid:
        return False, validation_result, None
        
    # Store the validated input
    field_name = step["field"]
    conversation_states[session_id]["collected_data"][field_name] = validation_result
    conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
    
    return True, None, validation_result

def advance_to_next_step(session_id: str, current_step_id: str) -> bool:
    """
    Advance to the next step in the conversation.
    
    Args:
        session_id: The session ID
        current_step_id: The current step ID
        
    Returns:
        bool: True if successfully advanced, False otherwise
    """
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found")
        return False
        
    current_step = get_step_by_id(current_step_id)
    if not current_step:
        logger.error(f"Invalid current step ID: {current_step_id}")
        return False
        
    next_step_id = current_step.get("next_step")
    
    if next_step_id:
        next_step = get_step_by_id(next_step_id)
        if not next_step:
            logger.error(f"Invalid next step ID: {next_step_id}")
            return False
            
        conversation_states[session_id]["current_step"] = next_step_id
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
        logger.info(f"Advanced session {session_id} from {current_step_id} to {next_step_id}")
        return True
    else:
        # No next step means we're at the end of the flow
        conversation_states[session_id]["current_step"] = "completed"
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
        logger.info(f"Session {session_id} completed all steps")
        return True

def process_user_input(session_id: str, user_input: str) -> Tuple[str, Dict[str, Any], Optional[str]]:
    """
    Process user input and update the conversation state.
    
    Args:
        session_id: The session ID
        user_input: The user input to process
        
    Returns:
        Tuple of (session_id, updated_state, error_message)
    """
    try:
        # Validate session
        if session_id not in conversation_states:
            logger.error(f"Session ID {session_id} not found")
            new_session_id = create_new_conversation_state()
            return new_session_id, conversation_states[new_session_id], None
            
        # Get current state
        conv_state = conversation_states[session_id]
        current_step_id = conv_state["current_step"]
        
        # If already completed, just return the current state
        if current_step_id == "completed":
            return session_id, conv_state, None
            
        # Get current step
        current_step = get_step_by_id(current_step_id)
        if not current_step:
            error_msg = f"Invalid current step: {current_step_id}"
            logger.error(error_msg)
            return session_id, conv_state, error_msg
            
        # Store the user input
        success, error_msg, formatted_input = store_user_input(session_id, current_step_id, user_input)
        if not success:
            return session_id, conv_state, error_msg
            
        # Advance to the next step
        advance_result = advance_to_next_step(session_id, current_step_id)
        if not advance_result:
            logger.warning(f"Failed to advance from step {current_step_id}")
            
        return session_id, conversation_states[session_id], None
        
    except Exception as e:
        error_msg = f"Error processing input: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return session_id, conv_state, error_msg

# --- API Endpoints ---

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/augment/murder', methods=['POST'])
def murder_agent_endpoint():
    """Murder Agent API endpoint."""
    try:
        # Get request data
        request_data = request.get_json()
        if not request_data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
            
        # Get session ID or create new one
        session_id = request_data.get("session_id")
        user_input = request_data.get("question", "").strip()
        force_new = request_data.get("force_new", False)
        
        # Create new session if needed
        if force_new or not session_id or session_id not in conversation_states:
            session_id = create_new_conversation_state()
            
        # Process the user input
        session_id, conv_state, error_msg = process_user_input(session_id, user_input)
        
        # Prepare response
        current_step_id = conv_state["current_step"]
        current_step = get_step_by_id(current_step_id)
        
        response_data = {
            "success": True,
            "session_id": session_id,
            "data": {
                "current_step": current_step_id,
                "collected_data": conv_state["collected_data"],
                "is_collecting_info": current_step_id != "completed"
            }
        }
        
        # Add next question or analysis result
        if current_step_id == "completed":
            response_data["data"]["message"] = "Analysis complete. Thank you for providing the information."
            # Here you would typically call the analysis function
            # analysis_result = analyze_case(conv_state["collected_data"])
            # response_data["data"]["analysis"] = analysis_result
        else:
            response_data["data"]["next_question"] = current_step["message"]
            
        return jsonify(response_data)
        
    except Exception as e:
        error_msg = f"Error in murder_agent_endpoint: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return jsonify({
            "success": False,
            "error": error_msg
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len(conversation_states)
    })

# --- Main Execution ---

if __name__ == "__main__":
    try:
        logger.info(f"Starting unified agent server on port {MAIN_PORT}")
        app.run(host="0.0.0.0", port=MAIN_PORT, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {e}", exc_info=True)
        print(f"ERROR: Failed to start server: {e}")
        sys.exit(1)
