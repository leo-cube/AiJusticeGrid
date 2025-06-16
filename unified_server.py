import asyncio
from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
import os
import json
import logging
import uuid
import re
from dotenv import load_dotenv
import requests
import time
import platform
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
from io import BytesIO

# Get the absolute path to the project root directory
PROJECT_ROOT = Path(__file__).parent.absolute()

# Path configuration - all paths are now absolute
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

# Import OpenAI with fallback
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI library not available, using fallback client")

# Import the murder investigation storage module
try:
    from murder_data_storage import murder_storage
    MURDER_STORAGE_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("Murder investigation storage module loaded successfully")
except ImportError as e:
    MURDER_STORAGE_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"Murder investigation storage module not available: {e}")

# Import the financial fraud agent module
try:
    import sys
    import os
    # Add the FinancialAgent directory to the path
    financial_agent_path = os.path.join(os.path.dirname(__file__), 'FinancialAgent')
    if financial_agent_path not in sys.path:
        sys.path.insert(0, financial_agent_path)

    from financial_fraud_agent_main import FinancialFraudAgent
    FINANCIAL_AGENT_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("Financial Fraud Agent module loaded successfully")
except ImportError as e:
    FINANCIAL_AGENT_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"Financial Fraud Agent module not available: {e}")

# Import the theft agent module
try:
    # Add the TheftAgent directory to the path
    theft_agent_path = os.path.join(os.path.dirname(__file__), 'TheftAgent')
    if theft_agent_path not in sys.path:
        sys.path.insert(0, theft_agent_path)

    from theft_agent_main import TheftAgent
    THEFT_AGENT_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("Theft Agent module loaded successfully")
except ImportError as e:
    THEFT_AGENT_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"Theft Agent module not available: {e}")

# Import ReportLab with fallback
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("ReportLab library not available, PDF generation will be limited")
    # Create dummy classes to prevent NameError
    class SimpleDocTemplate:
        pass
    class Paragraph:
        pass
    class Spacer:
        pass
    class Table:
        pass
    class TableStyle:
        pass
    class ParagraphStyle:
        pass
    class getSampleStyleSheet:
        pass
    class colors:
        black = None
        grey = None
        HexColor = lambda x: None
    class TA_CENTER:
        pass
    class TA_LEFT:
        pass
    class TA_JUSTIFY:
        pass
    inch = 1

# Load environment variables
load_dotenv()

# Configure logging with absolute path
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(PATHS['log_file']),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'murder-agent-secret-key')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})  # Enable CORS for all routes with credentials support

# Dictionary to store conversation states
# Format: {session_id: {current_step: step_name, collected_data: {field: value}}}
conversation_states = {}

# Dictionary to track analysis in progress
# Format: {session_id: {"status": "in_progress", "started_at": timestamp, "analysis_result": str}}
analysis_in_progress = {}

def cleanup_old_analysis_tracking():
    """Clean up old analysis tracking entries to prevent memory leaks."""
    current_time = datetime.now()
    expired_sessions = []

    for session_id, analysis_info in analysis_in_progress.items():
        started_at = datetime.fromisoformat(analysis_info["started_at"])
        # Remove entries older than 1 hour
        if (current_time - started_at).total_seconds() > 3600:
            expired_sessions.append(session_id)

    for session_id in expired_sessions:
        del analysis_in_progress[session_id]
        logger.info(f"Cleaned up expired analysis tracking for session {session_id}")

    return len(expired_sessions)

# Constants for Murder Agent
API_KEY_VAR = "NVIDIA_API_KEY"
MURDER_MODEL_NAME = "nvidia/llama-3.1-nemotron-ultra-253b-v1"

def retrieve_api_key():
    """
    Retrieve the API key from the .env file using absolute path.

    Returns:
        API key or None if not found
    """
    try:
        # Check if .env file exists using absolute path
        env_path = PATHS['env_file']
        if not env_path.exists():
            logger.error(f".env file not found at {env_path}")
            return None

        # Read .env file
        api_key = None
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith(f"{API_KEY_VAR}="):
                    api_key = line.strip().split('=', 1)[1]
                    break

        if not api_key:
            logger.error(f"API key not found in {env_path}")
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
        logger.info(f"Using API key from {PATHS['env_file']} file")
    else:
        logger.warning("NVIDIA_API_KEY not found in environment variables or .env file. Using default value.")
        NVIDIA_API_KEY = "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"

# Clean and validate the API key
if NVIDIA_API_KEY:
    NVIDIA_API_KEY = NVIDIA_API_KEY.strip()
    logger.info(f"API key loaded successfully (length: {len(NVIDIA_API_KEY)})")
else:
    logger.error("No API key available!")
    sys.exit(1)

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
        "enabled": True
    },
    "finance": {
        "system_prompt": "You are a specialized Financial Fraud Investigation AI Agent. Your role is to analyze financial fraud cases, detect suspicious transactions, identify money laundering schemes, and help investigators track financial crimes. Use knowledge of financial systems, fraud patterns, and forensic accounting in your responses.",
        "enabled": True
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

# Fixed OpenAI Client to bypass the 'proxies' parameter issue
class FixedOpenAIClient:
    """
    A fixed OpenAI client that works around the 'proxies' parameter issue.
    This client uses direct HTTP requests instead of the problematic OpenAI library.
    """

    def __init__(self, api_key, base_url="https://integrate.api.nvidia.com/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def chat_completions_create(self, model, messages, **kwargs):
        """Create a chat completion using direct HTTP request."""
        url = f"{self.base_url}/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            **kwargs
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()

            # Convert to match OpenAI response format
            class Choice:
                def __init__(self, message_content):
                    self.message = type('Message', (), {'content': message_content})()

            class Response:
                def __init__(self, choices):
                    self.choices = choices

            return Response([Choice(result['choices'][0]['message']['content'])])

        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")

    @property
    def chat(self):
        """Property to mimic OpenAI client structure."""
        return ChatCompletions(self)

class ChatCompletions:
    """Helper class to mimic OpenAI client structure."""

    def __init__(self, client):
        self.client = client

    @property
    def completions(self):
        """Completions property to match OpenAI client structure."""
        return CompletionsCreate(self.client)

class CompletionsCreate:
    """Helper class for completions.create method."""

    def __init__(self, client):
        self.client = client

    def create(self, **kwargs):
        """Create method that delegates to the client."""
        return self.client.chat_completions_create(**kwargs)

class MurderAgent:
    """
    Main interface for the Murder Agent that analyzes murder cases using the NVIDIA API.
    """

    def __init__(self, api_key):
        """
        Initialize the Murder Agent.

        Args:
            api_key: NVIDIA API key
        """
        if not api_key:
            raise ValueError("API key is required for Murder Agent initialization")

        # Clean and validate the API key
        self.api_key = api_key.strip() if isinstance(api_key, str) else str(api_key).strip()

        # Remove any potential extra characters or formatting issues
        self.api_key = self.api_key.replace('\n', '').replace('\r', '').replace('\t', '')

        if not self.api_key:
            raise ValueError("API key cannot be empty")

        # Validate API key format (should start with nvapi-)
        if not self.api_key.startswith('nvapi-'):
            raise ValueError(f"Invalid API key format. Expected to start with 'nvapi-', got: {self.api_key[:10]}...")

        logger.info(f"Initializing Murder Agent with API key length: {len(self.api_key)}")

        try:
            # Initialize OpenAI client with minimal parameters to avoid compatibility issues
            self.client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=self.api_key
            )
            logger.info(f"Murder Agent initialized successfully with model: {MURDER_MODEL_NAME}")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            logger.error(f"API key being used: {self.api_key[:15]}...")

            # Try alternative initialization methods
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
                                return ChatCompletions(self)

                        self.client = SimpleOpenAIClient(self.api_key, "https://integrate.api.nvidia.com/v1")
                        logger.info("Fallback client initialization successful!")

                    except Exception as e4:
                        logger.info(f"SimpleOpenAIClient failed: {str(e4)}")

                        # Method 3: Use our FixedOpenAIClient
                        try:
                            logger.info("Attempting FixedOpenAIClient initialization...")
                            self.client = FixedOpenAIClient(self.api_key, "https://integrate.api.nvidia.com/v1")
                            logger.info("FixedOpenAIClient initialization successful!")
                        except Exception as e5:
                            logger.error(f"All initialization methods failed. Last error: {str(e5)}")
                            raise e

            except Exception as e2:
                logger.error(f"Alternative initialization also failed: {str(e2)}")
                raise e

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

                    # Mark analysis as in progress
                    analysis_in_progress[session_id] = {
                        "status": "in_progress",
                        "started_at": datetime.now().isoformat()
                    }
                    logger.info(f"Marked analysis as in progress for session {session_id}")

                    # Perform the analysis
                    analysis = self.analyze_case(collected_data)

                    # Store the analysis result
                    analysis_in_progress[session_id]["analysis_result"] = analysis
                    analysis_in_progress[session_id]["status"] = "completed"
                    logger.info(f"Analysis completed for session {session_id}")

                    # Store the analysis result in conversation state for future requests
                    conversation_states[session_id]["analysis_result"] = analysis
                    conversation_states[session_id]["analysis_completed"] = True
                    conversation_states[session_id]["current_step"] = "completed"
                    logger.info(f"Stored analysis result in conversation state for session {session_id}")

                    # DON'T clean up analysis tracking yet - let the endpoint handle it
                    # This allows the frontend to retrieve the result on the next request

                    # Return the analysis
                    return session_id, analysis, False, "completed", None
                except Exception as e:
                    logger.error(f"Error analyzing case: {str(e)}")
                    # Clean up analysis tracking on error
                    if session_id in analysis_in_progress:
                        del analysis_in_progress[session_id]
                        logger.info(f"Cleaned up analysis tracking for session {session_id} due to error")
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
            "victim_name", "victim_age", "victim_gender", "cause_of_death",
            "weapon_used", "crime_scene_description", "witnesses",
            "evidence_found", "suspects", "additional_notes"
        ]

        for field in required_fields:
            if field not in standardized:
                standardized[field] = "N/A"  # Or an appropriate default

        return standardized

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
    """
    Create a new conversation state with a unique session ID.

    Returns:
        str: The newly generated session ID.
    """
    session_id = str(uuid.uuid4())
    conversation_states[session_id] = {
        "current_step": "greeting",
        "collected_data": {},
        "last_updated": datetime.now().isoformat()
    }
    logger.info(f"Created new conversation state with session ID: {session_id}")
    logger.info(f"New conversation state: {conversation_states[session_id]}")
    return session_id

# Helper function to get or create a conversation state
def get_or_create_conversation_state(session_id: Optional[str] = None) -> Tuple[str, Dict[str, Any]]:
    """
    Get an existing conversation state or create a new one.

    Args:
        session_id (Optional[str]): The session ID to retrieve. If None, a new session is created.

    Returns:
        Tuple[str, Dict[str, Any]]: The session ID and the corresponding conversation state.
    """
    if session_id and session_id in conversation_states:
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
        logger.info(f"Using existing conversation state with session ID: {session_id}")
        return session_id, conversation_states[session_id]

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
        input_value = input_value.strip()
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

        text_date_pattern = r'(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-zA-Z]+)(?:,?\s+)(\d{4})'
        text_date_match = re.search(text_date_pattern, input_value)
        if text_date_match:
            day, month_text, year = text_date_match.groups()
            month_text = month_text.lower()
            if month_text in month_names:
                month = month_names[month_text]
                return True, f"{year}-{month}-{day.zfill(2)}"

        alt_text_pattern = r'([a-zA-Z]+)(?:\s+)(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+)(\d{4})'
        alt_text_match = re.search(alt_text_pattern, input_value)
        if alt_text_match:
            month_text, day, year = alt_text_match.groups()
            month_text = month_text.lower()
            if month_text in month_names:
                month = month_names[month_text]
                return True, f"{year}-{month}-{day.zfill(2)}"

        date_pattern = r'^\d{4}-\d{1,2}-\d{1,2}$'
        if re.match(date_pattern, input_value):
            try:
                year, month, day = input_value.split('-')
                month_int = int(month)
                day_int = int(day)
                if not (1 <= month_int <= 12 and 1 <= day_int <= 31):
                    return False, "Please provide a valid date with month between 1-12 and day between 1-31."
                return True, f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            except ValueError:
                return False, "Please provide a valid date in YYYY-MM-DD format."

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
                            if len(year) == 2:
                                current_year = datetime.now().year
                                century = current_year // 100
                                year_int = int(year)
                                if year_int > current_year % 100:
                                    year = f"{century-1}{year}"
                                else:
                                    year = f"{century}{year}"

                        month_int = int(month)
                        day_int = int(day)
                        if not (1 <= month_int <= 12 and 1 <= day_int <= 31):
                            return False, "Please provide a valid date with month between 1-12 and day between 1-31."

                        return True, f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                except Exception as e:
                    logger.error(f"Error converting date format: {str(e)}")
                    continue

        return False, "Please provide a valid date in YYYY-MM-DD format. Examples: 2023-05-15, 05/15/2023, May 15, 2023."

    elif validation_type == "time":
        input_value = input_value.strip().lower()
        time_pattern = r'^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$'
        time_match = re.match(time_pattern, input_value)

        if time_match:
            hour, minute, ampm = time_match.groups()
            hour_int = int(hour)

            if ampm:
                if ampm.lower() == 'pm' and hour_int < 12:
                    hour_int += 12
                elif ampm.lower() == 'am' and hour_int == 12:
                    hour_int = 0

            if not (0 <= hour_int <= 23):
                return False, "Please provide a valid hour between 0-23 (or 1-12 with AM/PM)."

            if not (0 <= int(minute) <= 59):
                return False, "Please provide a valid minute between 0-59."

            return True, f"{hour_int:02d}:{minute}"

        hour_pattern = r'^(\d{1,2})\s*(am|pm)$'
        hour_match = re.match(hour_pattern, input_value)

        if hour_match:
            hour, ampm = hour_match.groups()
            hour_int = int(hour)

            if ampm.lower() == 'pm' and hour_int < 12:
                hour_int += 12
            elif ampm.lower() == 'am' and hour_int == 12:
                hour_int = 0

            if not (0 <= hour_int <= 23):
                return False, "Please provide a valid hour between 0-23 (or 1-12 with AM/PM)."

            return True, f"{hour_int:02d}:00"

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

        return False, "Please provide a valid time in HH:MM format, or with AM/PM. Examples: 14:30, 2:30 PM, noon."

    elif validation_type == "age":
        input_value = input_value.strip()
        age_pattern = r'(\d+)'
        age_match = re.search(age_pattern, input_value)

        if age_match:
            age = age_match.group(1)
            age_int = int(age)

            if not (0 <= age_int <= 120):
                return False, "Please provide a valid age between 0-120 years."

            return True, str(age_int)

        return False, "Please provide a valid numeric age. Example: 35."

    return True, None

def process_user_input(session_id: str, user_input: str) -> Tuple[str, Dict[str, Any], Optional[str]]:
    """
    Process user input for the current step of the conversation.

    Args:
        session_id: The current session ID.
        user_input: The input provided by the user.

    Returns:
        Tuple of (session_id, updated_conversation_state, error_message)
    """
    conv_state = conversation_states.get(session_id)
    if not conv_state:
        return session_id, {}, "Invalid session ID."

    current_step_id = conv_state["current_step"]
    current_step = get_step_by_id(current_step_id)

    if not current_step:
        return session_id, conv_state, "Invalid current step in conversation state."

    field_to_fill = current_step.get("field")
    validation_type = current_step.get("validation")

    if validation_type:
        is_valid, formatted_value_or_error = validate_input(user_input, validation_type)
        if not is_valid:
            return session_id, conv_state, formatted_value_or_error
        else:
            user_input = formatted_value_or_error if formatted_value_or_error is not None else user_input

    if field_to_fill:
        conv_state["collected_data"][field_to_fill] = user_input
        logger.info(f"Collected data for {field_to_fill}: {user_input}")

    next_step = get_next_step(current_step_id)

    if next_step:
        conv_state["current_step"] = next_step["id"]
        logger.info(f"Moving to next step: {next_step['id']}")
    else:
        conv_state["current_step"] = "analysis"
        logger.info("All data collected, moving to analysis step.")

    conv_state["last_updated"] = datetime.now().isoformat()
    return session_id, conv_state, None


# PDF Generation Functions

def create_murder_report_pdf(case_data: Dict[str, Any], analysis_result: str) -> BytesIO:
    """
    Generates a PDF report for a murder investigation case.

    Args:
        case_data: Dictionary containing the collected case details.
        analysis_result: The analysis provided by the Murder Agent.

    Returns:
        A BytesIO object containing the PDF data.
    """
    if not REPORTLAB_AVAILABLE:
        logger.error("ReportLab is not available. Cannot generate PDF.")
        raise RuntimeError("PDF generation library (ReportLab) not found.")

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    h1_style = styles['h1']
    h2_style = styles['h2']
    h3_style = styles['h3']
    normal_style = styles['Normal']
    normal_style.alignment = TA_JUSTIFY

    story.append(Paragraph("Murder Investigation Report", h1_style))
    story.append(Spacer(1, 0.2 * inch))

    case_id = case_data.get('case_id', 'N/A')
    story.append(Paragraph(f"Case ID: <b>{case_id}</b>", normal_style))
    story.append(Spacer(1, 0.1 * inch))

    story.append(Paragraph(f"Date of Report: <b>{datetime.now().strftime('%Y-%m-%d %H:%M')}</b>", normal_style))
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("Case Details", h2_style))
    story.append(Spacer(1, 0.1 * inch))

    table_data = []
    for key, value in case_data.items():
        if key != 'case_id':
            formatted_key = key.replace('_', ' ').title()
            table_data.append([f"<b>{formatted_key}:</b>", str(value)])

    if table_data:
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#D3D3D3')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F0F0')),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ])
        table_data.insert(0, [Paragraph("<b>Field</b>", normal_style), Paragraph("<b>Detail</b>", normal_style)])
        table = Table(table_data, colWidths=[2 * inch, 5 * inch])
        table.setStyle(table_style)
        story.append(table)
        story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("Agent Analysis", h2_style))
    story.append(Spacer(1, 0.1 * inch))

    analysis_paragraphs = analysis_result.split('\n\n')
    for para_text in analysis_paragraphs:
        if para_text.strip():
            story.append(Paragraph(para_text.strip(), normal_style))
            story.append(Spacer(1, 0.1 * inch))

    doc.build(story)
    buffer.seek(0)
    return buffer


# Flask Routes

@app.route('/')
def index():
    return "Unified Agent Server is running!"

@app.route('/start_conversation', methods=['POST'])
def start_conversation():
    logger.info("Received request to start a new conversation.")
    session_id = create_new_conversation_state()
    current_step = get_step_by_id("greeting")
    return jsonify({
        "session_id": session_id,
        "response": current_step["message"],
        "is_collecting_info": True,
        "current_step": "greeting",
        "error": None
    })

@app.route('/process_message', methods=['POST'])
def process_message_route():
    data = request.get_json()
    user_message = data.get('message')
    session_id = data.get('session_id')
    force_new_session = data.get('force_new_session', False)
    reset_conversation = data.get('reset_conversation', False)
    agent_type = data.get('agent_type', 'murder') # Default to murder agent

    logger.info(f"[/process_message] Received message: {user_message}, session_id: {session_id}, agent_type: {agent_type}")

    if not user_message and not session_id:
        return jsonify({"error": "Message or session_id is required"}), 400

    current_agent = None
    if agent_type == 'murder':
        if not MURDER_STORAGE_AVAILABLE:
            return jsonify({"error": "Murder Agent module not available."}), 500
        current_agent = MurderAgent(NVIDIA_API_KEY)
    elif agent_type == 'finance':
        if not FINANCIAL_AGENT_AVAILABLE:
            return jsonify({"error": "Financial Agent module not available."}), 500
        current_agent = FinancialFraudAgent(NVIDIA_API_KEY)
    elif agent_type == 'theft':
        if not THEFT_AGENT_AVAILABLE:
            return jsonify({"error": "Theft Agent module not available."}), 500
        current_agent = TheftAgent(NVIDIA_API_KEY)
    else:
        return jsonify({"error": f"Agent type '{agent_type}' not supported."}), 400

    session_id, response_message, is_collecting_info, current_step_id, error_message = \
        current_agent.process_message(user_message, session_id, force_new_session, reset_conversation)

    if current_step_id == "completed" and session_id in conversation_states and conversation_states[session_id].get("analysis_completed"):
        logger.info(f"Analysis completed for session {session_id}. Preparing PDF.")
        collected_data = conversation_states[session_id]["collected_data"]
        analysis_result = conversation_states[session_id]["analysis_result"]

        try:
            pdf_buffer = create_murder_report_pdf(collected_data, analysis_result)
            pdf_filename = f"murder_report_{collected_data.get('case_id', 'unknown')}.pdf"
            pdf_path = PATHS['data_dir'] / pdf_filename

            with open(pdf_path, 'wb') as f:
                f.write(pdf_buffer.getvalue())

            logger.info(f"PDF generated and saved to {pdf_path}")

            if session_id in conversation_states:
                del conversation_states[session_id]
                logger.info(f"Cleaned up conversation state for session {session_id} after PDF generation.")

            return jsonify({
                "session_id": session_id,
                "response": response_message,
                "is_collecting_info": is_collecting_info,
                "current_step": current_step_id,
                "error": error_message,
                "pdf_report_path": str(pdf_path)  # Return the path to the generated PDF
            })

        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            return jsonify({"error": f"Error generating PDF report: {str(e)}"}), 500

    return jsonify({
        "session_id": session_id,
        "response": response_message,
        "is_collecting_info": is_collecting_info,
        "current_step": current_step_id,
        "error": error_message
    })

@app.route('/download_report/<filename>', methods=['GET'])
def download_report(filename):
    report_path = PATHS['data_dir'] / filename
    if report_path.exists():
        return send_file(report_path, as_attachment=True)
    else:
        return jsonify({"error": "Report not found"}), 404

@app.route('/get_analysis_status/<session_id>', methods=['GET'])
def get_analysis_status(session_id):
    status_info = analysis_in_progress.get(session_id)
    if status_info:
        return jsonify(status_info)
    else:
        return jsonify({"status": "not_found", "message": "No analysis in progress for this session."})

@app.route('/get_analysis_result/<session_id>', methods=['GET'])
def get_analysis_result(session_id):
    analysis_info = analysis_in_progress.get(session_id)
    if analysis_info and analysis_info.get("status") == "completed":
        return jsonify({"status": "completed", "result": analysis_info["analysis_result"]})
    elif analysis_info and analysis_info.get("status") == "in_progress":
        return jsonify({"status": "in_progress", "message": "Analysis is still in progress."})
    else:
        return jsonify({"status": "not_found", "message": "No completed analysis found for this session."})


if __name__ == '__main__':
    # Run cleanup of old analysis tracking periodically (e.g., every hour)
    # This is a simple in-memory cleanup. For production, consider a more robust solution.
    # For now, we'll just log a message.
    logger.info("Starting unified agent server.")
    # In a real-world scenario, you'd use a scheduler like APScheduler or Celery for cleanup.
    # For this example, we'll just run Flask.
    app.run(debug=True, host='0.0.0.0', port=MAIN_PORT)

