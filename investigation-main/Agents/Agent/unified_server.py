from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import json
import logging
import uuid
import re
import httpx
from dotenv import load_dotenv
import requests
import time
import platform
import sys
from openai import OpenAI
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("unified_agent_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'murder-agent-secret-key')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
CORS(app, supports_credentials=True)  # Enable CORS for all routes with credentials support

# Dictionary to store conversation states
# Format: {session_id: {current_step: step_name, collected_data: {field: value}}}
conversation_states = {}

# Constants for Murder Agent
ENV_FILE = ".env"
API_KEY_VAR = "NVIDIA_API_KEY"
MURDER_MODEL_NAME = "nvidia/llama-3.1-nemotron-ultra-253b-v1"

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

# Main port for the unified server
MAIN_PORT = int(os.getenv('MAIN_PORT', 5000))

# Agent configuration
AGENTS = {
    "murder": {
        "system_prompt": "You are a specialized Murder Investigation AI Agent. Your role is to analyze murder cases, provide insights, and help investigators solve crimes. Use forensic knowledge, criminal psychology, and investigative techniques in your responses.",
        "enabled": True
    },
    "theft": {
        "system_prompt": "You are a specialized Theft Investigation AI Agent. Your role is to analyze theft cases, track stolen items, identify patterns, and help investigators recover property and identify perpetrators. Use knowledge of theft techniques, evidence analysis, and investigative methods in your responses.",
        "enabled": False
    },
    "finance": {
        "system_prompt": "You are a specialized Financial Fraud Investigation AI Agent. Your role is to analyze financial fraud cases, detect suspicious transactions, identify money laundering schemes, and help investigators track financial crimes. Use knowledge of financial systems, fraud patterns, and forensic accounting in your responses.",
        "enabled": False
    },
    "smuggle": {
        "system_prompt": "You are a specialized Smuggling Investigation AI Agent. Your role is to analyze smuggling cases, identify smuggling routes, and help investigators track contraband. Use knowledge of smuggling techniques, border security, and investigative methods in your responses.",
        "enabled": False
    },
    "crime-accident": {
        "system_prompt": "You are a specialized Accident Investigation AI Agent. Your role is to analyze accident cases, determine causes, and help investigators establish liability. Use knowledge of accident reconstruction, forensic analysis, and investigative methods in your responses.",
        "enabled": False
    },
    "crime-abuse": {
        "system_prompt": "You are a specialized Abuse Investigation AI Agent. Your role is to analyze abuse cases, identify patterns, and help investigators protect victims. Use knowledge of abuse dynamics, victim psychology, and investigative methods in your responses.",
        "enabled": False
    }
}

class BaseAgent:
    """
    Base class for all agents that use the NVIDIA API.
    """
    
    def __init__(self, api_key, model_name, system_prompt):
        """
        Initialize the Base Agent.

        Args:
            api_key: NVIDIA API key
            model_name: Name of the model to use
            system_prompt: System prompt for the agent
        """
        self.api_key = api_key
        self.model_name = model_name
        self.system_prompt = system_prompt
        # Initialize the OpenAI client with compatibility settings for NVIDIA API
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key,
            http_client=httpx.Client(
                base_url="https://integrate.api.nvidia.com/v1",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
            )
        )
        logger.info(f"{self.__class__.__name__} initialized with model: {model_name}")
    
    def generate_response(self, prompt):
        """
        Generate a response using the NVIDIA API.
        
        Args:
            prompt: The user's prompt
            
        Returns:
            The generated response text
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return f"Error: {str(e)}"

class MurderAgent(BaseAgent):
    """
    Specialized agent for murder case analysis using the NVIDIA API.
    """
    
    def __init__(self, api_key):
        """
        Initialize the Murder Agent.

        Args:
            api_key: NVIDIA API key
        """
        system_prompt = AGENTS["murder"]["system_prompt"]
        super().__init__(api_key, MURDER_MODEL_NAME, system_prompt)
        
        # Initialize conversation states for this agent
        self.conversation_states = {}
        logger.info(f"Murder Agent initialized with model: {MURDER_MODEL_NAME}")

    def analyze_case(self, case_details):
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
                model=MURDER_MODEL_NAME,
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
            logger.info("Case analysis completed (using Murder Agent)")
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing case with Murder Agent: {str(e)}")
            return f"Error analyzing case: {str(e)}"

    def process_message(self, message: str, session_id: Optional[str] = None, force_new_session: bool = False, reset_conversation: bool = False) -> Tuple[str, str, bool, str, Optional[str]]:
        """
        Process a message from the user and update the conversation state.

        Args:
            message: The user's message
            session_id: Optional session ID for continuing a conversation
            force_new_session: Force creation of a new session regardless of existing session
            reset_conversation: Reset the conversation state but keep the session ID

        Returns:
            Tuple of (session_id, response_message, is_collecting_info, current_step, error_message)
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
                session_id = create_new_conversation_state()
            # If we're resetting the conversation but keeping the session ID
            elif reset_conversation and session_id and session_id in conversation_states:
                logger.info(f"Resetting conversation state for session {session_id}")
                conversation_states[session_id] = {
                    "current_step": "greeting",
                    "collected_data": {},
                    "last_updated": datetime.now().isoformat()
                }
            # Otherwise, create a new session
            else:
                logger.info("Creating a new session")
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

    def _format_case_prompt(self, case_details: Dict[str, Any]) -> str:
        """
        Format case details into a prompt for the model.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Formatted prompt string
        """
        # Standardize and clean the case details
        standardized_details = self._standardize_case_details(case_details)

        # Check if this is a direct question
        if "question" in standardized_details and len(standardized_details) <= 3:  # Only question and maybe case_id/additional_notes
            question = standardized_details["question"]
            prompt = f"As a Murder Investigation AI Agent specialized in homicide investigations and forensic analysis, please answer the following question:\n\n{question}\n\n"

            if "additional_notes" in standardized_details and standardized_details["additional_notes"]:
                prompt += f"Additional context: {standardized_details['additional_notes']}\n\n"

            prompt += "Provide a detailed, evidence-based response using your expertise in forensic science, criminal psychology, and investigative techniques."
            return prompt

        # Regular case analysis
        prompt = "Analyze the following murder case and provide insights and solutions based ONLY on the data provided:\n\n"

        # Format the case details in a structured way
        for key, value in standardized_details.items():
            if value and key != "question":  # Skip the question field if present
                formatted_key = key.replace('_', ' ').title()
                prompt += f"{formatted_key}: {value}\n"

        prompt += "\n\nBased on these specific details, please provide:\n"
        prompt += "1. A comprehensive analysis of the case\n"
        prompt += "2. Potential motives and suspects to consider based on the evidence\n"
        prompt += "3. Recommended investigative approaches specific to this case\n"
        prompt += "4. Key evidence to focus on and how to analyze it\n"
        prompt += "5. Possible solutions or conclusions that follow directly from the data\n"
        prompt += "\nImportant: Base your analysis ONLY on the information provided in this case. Do not use generic templates or assumptions not supported by the data."

        return prompt

    def _standardize_case_details(self, case_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize and clean the case details to ensure they're in the correct format.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Standardized case details dictionary
        """
        standardized = {}

        # Copy all fields to the standardized dictionary
        for key, value in case_details.items():
            if value:  # Skip empty values
                # Convert to string if not already
                if not isinstance(value, str):
                    value = str(value)

                # Clean up the value (remove extra whitespace, etc.)
                value = value.strip()

                # Store in the standardized dictionary
                standardized[key] = value

        # Ensure all required fields are present
        required_fields = [
            "case_id", "date_of_crime", "time_of_crime", "location",
            "victim_name", "victim_age", "victim_gender", "cause_of_death"
        ]

        for field in required_fields:
            if field not in standardized:
                standardized[field] = "Unknown"

        # Format specific fields

        # Date: Ensure it's in YYYY-MM-DD format
        if "date_of_crime" in standardized and standardized["date_of_crime"] != "Unknown":
            date_value = standardized["date_of_crime"]
            is_valid, formatted_date = validate_input(date_value, "date")
            if is_valid and formatted_date:
                standardized["date_of_crime"] = formatted_date

        # Time: Ensure it's in HH:MM format
        if "time_of_crime" in standardized and standardized["time_of_crime"] != "Unknown":
            time_value = standardized["time_of_crime"]
            is_valid, formatted_time = validate_input(time_value, "time")
            if is_valid and formatted_time:
                standardized["time_of_crime"] = formatted_time

        # Age: Ensure it's a number
        if "victim_age" in standardized and standardized["victim_age"] != "Unknown":
            age_value = standardized["victim_age"]
            is_valid, formatted_age = validate_input(age_value, "age")
            if is_valid and formatted_age:
                standardized["victim_age"] = formatted_age

        return standardized

def call_nvidia_api(prompt, system_prompt):
    """Call the NVIDIA API with the given prompt and system prompt."""
    try:
        logger.info(f"Calling NVIDIA API with prompt: {prompt[:50]}...")

        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "top_p": 0.95,
            "max_tokens": 1024
        }

        response = requests.post(
            "https://api.nvidia.com/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            logger.error(f"NVIDIA API error: {response.status_code} - {response.text}")
            return f"Error calling NVIDIA API: {response.status_code}"

        result = response.json()
        return result["choices"][0]["message"]["content"]

    except Exception as e:
        logger.error(f"Error calling NVIDIA API: {str(e)}")
        return f"Error: {str(e)}"

def format_case_details(case_details):
    """Format case details into a structured prompt for the AI."""
    prompt = "# Case Details\n\n"

    # Add all case details to the prompt
    for key, value in case_details.items():
        if key != "question" and value and value != "Unknown":
            # Convert snake_case to Title Case for readability
            formatted_key = key.replace('_', ' ').title()
            prompt += f"- {formatted_key}: {value}\n"

    # Add the question at the end
    if "question" in case_details:
        prompt += f"\n# Question\n\n{case_details['question']}\n\n"
        prompt += "Please provide a detailed analysis of this case based on the information provided."

    return prompt

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
        "validation": "date"  # Fixed to match the field name
    },
    {
        "id": "time_of_crime",
        "message": "What time did the crime occur? (HH:MM format, or approximate time like '2:30 PM', 'noon', or 'evening')",
        "field": "time_of_crime",
        "next_step": "location",
        "validation": "time"  # Fixed to match the field name
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

# Dictionary to store conversation states
conversation_states = {}

# Helper function to get step by ID
def get_step_by_id(step_id):
    """Get a step by its ID."""
    for step in CASE_INFO_STEPS:
        if step["id"] == step_id:
            return step
    return None

# Helper function to get the next step
def get_next_step(current_step_id):
    """Get the next step after the current step."""
    current_step = get_step_by_id(current_step_id)
    if current_step and current_step["next_step"]:
        return get_step_by_id(current_step["next_step"])
    return None

# Helper function to create a new conversation state
def create_new_conversation_state():
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

# Helper function to get or create a conversation state
def get_or_create_conversation_state(session_id=None):
    """Get an existing conversation state or create a new one."""
    if session_id and session_id in conversation_states:
        # Update the last updated timestamp
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
        logger.info(f"Using existing conversation state with session ID: {session_id}")
        return session_id, conversation_states[session_id]

    # Create a new conversation state
    new_session_id = create_new_conversation_state()
    return new_session_id, conversation_states[new_session_id]

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
def advance_to_next_step(session_id, current_step_id):
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

# Helper function to handle user input and update conversation state
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
        new_session_id, conv_state = get_or_create_conversation_state(None)
        logger.info(f"Created new session {new_session_id} for non-existent session {session_id}")
        return new_session_id, conv_state, None

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

# Initialize the Murder Agent
murder_agent = MurderAgent(NVIDIA_API_KEY)
logger.info("Murder Agent initialized in unified server")

# Create a specialized endpoint for the Murder Agent
@app.route('/api/augment/murder', methods=['POST'])
def murder_agent_endpoint():
    """Murder Agent API endpoint."""
    logger.info("Received request for Murder Agent")

    # Check if the agent is enabled
    if not AGENTS["murder"]["enabled"]:
        return jsonify({
            "success": False,
            "error": "Murder Agent is not enabled",
            "data": {
                "analysis": "Murder Agent is not enabled. Please enable it in the settings."
            }
        }), 403

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

    # Get the session ID, user input, and special flags from the request
    session_id = case_details.get("session_id")
    user_input = case_details.get("question", "")
    force_new_session = case_details.get("force_new_session", False)
    reset_conversation = case_details.get("reset_conversation", False)
    force_reset = case_details.get("forceReset", False)  # For compatibility with frontend

    # If force_reset is True, set both flags
    if force_reset:
        force_new_session = True
        reset_conversation = True

    # Special handling for FORCE_NEW_SESSION command
    if user_input == "FORCE_NEW_SESSION":
        logger.info("FORCE_NEW_SESSION command detected")
        force_new_session = True
        reset_conversation = True
        user_input = ""  # Clear the input to get the greeting

    logger.info(f"Received request with session_id: {session_id}, user_input: {user_input}")
    logger.info(f"force_new_session: {force_new_session}, reset_conversation: {reset_conversation}")

    # Process the message using the new process_message method with the special flags
    session_id, response, is_collecting_info, current_step, error_message = murder_agent.process_message(
        user_input,
        session_id,
        force_new_session=force_new_session,
        reset_conversation=reset_conversation
    )

    # Return the response with the session ID and conversation state
    return jsonify({
        "success": True,
        "data": {
            "analysis": response,
            "is_collecting_info": is_collecting_info,
            "current_step": current_step,
            "collected_data": conversation_states[session_id]["collected_data"] if session_id in conversation_states else {},
            "error": error_message
        },
        "session_id": session_id,
        "message": "Message processed successfully"
    })

# Initialize all agents with NVIDIA API
agents = {}
for agent_name, agent_config in AGENTS.items():
    if agent_name == "murder":
        # Use the specialized MurderAgent for the murder agent
        agents[agent_name] = MurderAgent(NVIDIA_API_KEY)
    else:
        # Create a generic agent for other agent types
        class GenericAgent(BaseAgent):
            def __init__(self, api_key, model_name, system_prompt):
                super().__init__(api_key, model_name, system_prompt)
                self.conversation_states = {}
        
        agents[agent_name] = GenericAgent(
            NVIDIA_API_KEY,
            MURDER_MODEL_NAME,  # Use the same model for all agents for consistency
            agent_config["system_prompt"]
        )

# Create endpoints for all agents
for agent_name, agent in agents.items():
    # Skip the murder agent as we've already created a specialized endpoint for it
    if agent_name == "murder":
        continue

    # Create a closure to capture the agent_name and agent variables
    def create_endpoint(agent_name, agent):
        def endpoint_func():
            logger.info(f"Received request for {agent} agent")

            # Check if the agent is enabled
            if not AGENTS[agent]["enabled"]:
                return jsonify({"error": f"Agent {agent} is not enabled"}), 403

            # Get case details from request
            case_details = request.json
            if not case_details:
                return jsonify({"error": "No case details provided"}), 400

            # Check if the agent is enabled
            if not AGENTS[agent_name]["enabled"]:
                return jsonify({
                    "success": False,
                    "error": f"{agent_name.capitalize()} Agent is not enabled",
                    "data": {
                        "analysis": f"{agent_name.capitalize()} Agent is not enabled. Please enable it in the settings."
                    }
                }), 403

            # Get the user's message and session ID from the request
            data = request.get_json()
            user_message = data.get("question", "")
            session_id = data.get("session_id", str(uuid.uuid4()))

            # Initialize conversation state if it doesn't exist
            if session_id not in agent.conversation_states:
                agent.conversation_states[session_id] = {
                    "current_step": "greeting",
                    "collected_data": {}
                }

            # Get the current conversation state
            state = agent.conversation_states[session_id]

            try:
                # Generate response using the agent's model
                response = agent.generate_response(user_message)

                # Return the response
                return jsonify({
                    "success": True,
                    "data": {
                        "analysis": response,
                        "is_collecting_info": False,
                        "current_step": state["current_step"],
                        "collected_data": state["collected_data"],
                        "error": None
                    },
                    "session_id": session_id,
                    "message": f"{agent_name.capitalize()} Agent response"
                })

            except Exception as e:
                logger.error(f"Error in {agent_name} agent: {str(e)}")
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "data": {
                        "analysis": f"An error occurred while processing your request: {str(e)}",
                        "is_collecting_info": False,
                        "current_step": state.get("current_step", ""),
                        "collected_data": state.get("collected_data", {})
                    },
                    "session_id": session_id
                }), 500

        return endpoint_func

    # Create the endpoint function with the current agent_name and agent instance
    endpoint_func = create_endpoint(agent_name, agent)

    # Register the route with a unique function for each agent
    app.add_url_rule(
        f"/api/augment/{agent_name}",
        endpoint=f"{agent_name}_endpoint",
        view_func=endpoint_func,
        methods=["POST"]
    )

# Get the full health status including enabled agents
@app.route("/api/health/full", methods=["GET"])
@app.route("/health/full", methods=["GET"])  # Alternative route without /api prefix
def full_health_check():
    """Full health check endpoint with detailed information."""
    logger.info("Received GET request for full health endpoint")
    return jsonify({
        "status": "healthy",
        "agents": list(AGENTS.keys()),
        "enabled_agents": {name: config["enabled"] for name, config in AGENTS.items()},
        "murder_agent": {
            "status": "integrated",
            "model": MURDER_MODEL_NAME,
            "api_key_source": "env" if os.getenv('NVIDIA_API_KEY') else (".env file" if retrieve_api_key() else "default")
        },
        "system_info": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    })

# Agent toggle endpoint
@app.route('/toggle-agent', methods=['GET', 'POST'])
def toggle_agent():
    """Toggle agent enabled status."""
    logger.info(f"Received {request.method} request for toggle-agent endpoint")
    if request.method == "GET":
        # Return the current enabled status of all agents
        enabled_agents = {name: config["enabled"] for name, config in AGENTS.items()}
        return jsonify({
            "success": True,
            "data": enabled_agents,
            "message": "Successfully retrieved enabled agents"
        })

    elif request.method == "POST":
        try:
            # Get the agent ID and enabled status from the request
            data = request.json

            # Validate required fields
            if not data or "agentId" not in data or "enabled" not in data:
                return jsonify({
                    "success": False,
                    "error": "Missing required fields: agentId and enabled"
                }), 400

            agent_id = data["agentId"]
            enabled = data["enabled"]

            # Validate agent ID
            if agent_id not in AGENTS:
                return jsonify({
                    "success": False,
                    "error": f"Invalid agent ID: {agent_id}"
                }), 400

            # Update the agent's enabled status
            AGENTS[agent_id]["enabled"] = enabled

            logger.info(f"Agent {agent_id} {'enabled' if enabled else 'disabled'}")

            return jsonify({
                "success": True,
                "data": {
                    "agentId": agent_id,
                    "enabled": enabled
                },
                "message": f"Agent {agent_id} has been {'enabled' if enabled else 'disabled'}"
            })

        except Exception as e:
            logger.error(f"Error toggling agent: {str(e)}")
            return jsonify({
                "success": False,
                "error": f"Failed to toggle agent: {str(e)}"
            }), 500

# Bulk update agent statuses
@app.route('/update-agents', methods=['POST'])
def update_agents():
    """Update multiple agent statuses at once."""
    logger.info(f"Received POST request for update-agents endpoint")
    try:
        data = request.json

        # Validate required fields
        if not data or "agents" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: agents"
            }), 400

        agents_data = data["agents"]

        # Update each agent's enabled status
        for agent_id, enabled in agents_data.items():
            if agent_id in AGENTS:
                AGENTS[agent_id]["enabled"] = enabled
                logger.info(f"Agent {agent_id} {'enabled' if enabled else 'disabled'}")

        return jsonify({
            "success": True,
            "data": {
                "agents": {name: config["enabled"] for name, config in AGENTS.items()}
            },
            "message": "Agent statuses updated successfully"
        })

    except Exception as e:
        logger.error(f"Error updating agents: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to update agents: {str(e)}"
        }), 500

# Endpoint to get the current conversation state
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

# Endpoint to reset a conversation
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

# Sample case endpoint for Murder Agent
@app.route('/api/augment/murder/sample', methods=['GET'])
def murder_agent_sample():
    """Sample case endpoint for Murder Agent."""
    logger.info("Received request for Murder Agent sample case")

    # Sample case details
    sample_case = {
        "case_id": "SAMPLE-001",
        "date_of_crime": "2023-10-15",
        "time_of_crime": "23:30",
        "location": "789 Elm Street, Apartment 3C",
        "victim_name": "Robert Johnson",
        "victim_age": "42",
        "victim_gender": "Male",
        "cause_of_death": "Multiple stab wounds to the chest",
        "weapon_used": "Kitchen knife",
        "crime_scene_description": "Victim found in living room. Signs of struggle. Furniture overturned. No signs of forced entry.",
        "witnesses": "Neighbor heard argument around 23:00",
        "evidence_found": "Bloody knife, fingerprints on door handle, victim's phone with text messages",
        "suspects": "Ex-wife with history of threats, business partner with financial dispute",
        "additional_notes": "Victim recently changed his will, removing ex-wife as beneficiary"
    }

    # Analyze the sample case
    try:
        analysis = murder_agent.analyze_case(sample_case)

        # Return the response in the format expected by the frontend
        return jsonify({
            "success": True,
            "data": {
                "analysis": analysis,
                "case_details": sample_case
            },
            "message": "Sample case analysis completed successfully"
        })
    except Exception as e:
        logger.error(f"Error analyzing sample case with Murder Agent: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Error analyzing sample case: {str(e)}",
            "data": {
                "analysis": f"Error analyzing sample case: {str(e)}"
            }
        }), 500

# Simple test endpoints
@app.route('/')
def home():
    logger.info("Received GET request for home endpoint")
    return jsonify({"message": "Unified Agent Server is running"})

@app.route('/test')
def test():
    logger.info("Received GET request for test endpoint")
    return jsonify({"message": "Test endpoint is working"})

@app.route('/agents')
def list_agents():
    logger.info("Received GET request for agents endpoint")
    return jsonify({
        "agents": list(AGENTS.keys()),
        "enabled_agents": {name: config["enabled"] for name, config in AGENTS.items()}
    })

if __name__ == "__main__":
    logger.info(f"Starting unified agent server on port {MAIN_PORT}")
    # Enable debug mode for development
    app.run(host="0.0.0.0", port=MAIN_PORT, debug=True)
