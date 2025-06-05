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
CORS(app, supports_credentials=True)  # Enable CORS for all routes with credentials support

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

def generate_incident_pdf(incident_data):
    """
    Generate a PDF report for an incident using ReportLab.

    Args:
        incident_data: Dictionary containing incident information

    Returns:
        BytesIO object containing the PDF data
    """
    if not REPORTLAB_AVAILABLE:
        # Return a simple text-based response when ReportLab is not available
        buffer = BytesIO()
        error_message = "PDF generation is not available. ReportLab library is not installed.\n"
        error_message += "Please install ReportLab with: pip install reportlab\n\n"
        error_message += "Case Data:\n"
        for key, value in incident_data.items():
            error_message += f"{key}: {value}\n"
        buffer.write(error_message.encode('utf-8'))
        buffer.seek(0)
        return buffer

    buffer = BytesIO()

    # Create the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)

    # Get styles
    styles = getSampleStyleSheet()

    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#003366')
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#003366')
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )

    # Build the story (content)
    story = []

    # Title
    story.append(Paragraph("INCIDENT INVESTIGATION REPORT", title_style))
    story.append(Spacer(1, 20))

    # Header information
    header_data = [
        ['Report ID:', incident_data.get('id', 'Unknown')],
        ['Date Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
        ['Status:', incident_data.get('status', 'Unknown')],
        ['Report Type:', 'AI Generated Investigation Report']
    ]

    header_table = Table(header_data, colWidths=[2*inch, 4*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f2f2f2')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    story.append(header_table)
    story.append(Spacer(1, 20))

    # Incident Details Section
    story.append(Paragraph("INCIDENT DETAILS", heading_style))

    # Create incident details table with dynamic data
    incident_details = [
        ['Date of Incident:', incident_data.get('date', 'Unknown')],
        ['Time of Incident:', incident_data.get('time', 'Unknown')],
        ['Location:', incident_data.get('location', 'Unknown')],
        ['Incident Type:', incident_data.get('incident_type', 'Unknown')],
        ['Reporting Officer:', incident_data.get('reporting_officer', 'Unknown')],
        ['Evidence:', incident_data.get('evidence', 'Unknown')]
    ]

    details_table = Table(incident_details, colWidths=[2*inch, 4*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))

    story.append(details_table)
    story.append(Spacer(1, 20))

    # Victims Section
    if 'victims' in incident_data and incident_data['victims']:
        story.append(Paragraph("VICTIMS", heading_style))

        for i, victim in enumerate(incident_data['victims']):
            victim_data = [
                [f'Victim {i+1} Name:', victim.get('name', 'Unknown')],
                ['Age:', str(victim.get('age', 'Unknown'))],
                ['Gender:', victim.get('gender', 'Unknown')],
                ['Injuries:', victim.get('injuries', 'Unknown')]
            ]

            victim_table = Table(victim_data, colWidths=[2*inch, 4*inch])
            victim_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff3cd')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))

            story.append(victim_table)
            story.append(Spacer(1, 10))

    # Suspects Section
    if 'suspects' in incident_data and incident_data['suspects']:
        story.append(Paragraph("SUSPECTS", heading_style))

        for i, suspect in enumerate(incident_data['suspects']):
            suspect_data = [
                [f'Suspect {i+1} Name:', suspect.get('name', 'Unknown')],
                ['Age:', str(suspect.get('age', 'Unknown'))],
                ['Gender:', suspect.get('gender', 'Unknown')],
                ['Description:', suspect.get('description', 'Unknown')]
            ]

            suspect_table = Table(suspect_data, colWidths=[2*inch, 4*inch])
            suspect_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8d7da')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))

            story.append(suspect_table)
            story.append(Spacer(1, 10))

    # Description Section
    if 'description' in incident_data and incident_data['description']:
        story.append(Paragraph("INCIDENT DESCRIPTION", heading_style))
        story.append(Paragraph(incident_data['description'], normal_style))
        story.append(Spacer(1, 15))

    # AI Analysis Section (if available)
    if 'ai_analysis' in incident_data and incident_data['ai_analysis']:
        story.append(Paragraph("AI ANALYSIS", heading_style))
        story.append(Paragraph(incident_data['ai_analysis'], normal_style))
        story.append(Spacer(1, 15))

    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph(f"Generated by AI Justice Grid Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))

    # Build the PDF
    doc.build(story)

    # Get the value of the BytesIO buffer and return it
    buffer.seek(0)
    return buffer

# Initialize the Murder Agent
try:
    logger.info(f"Attempting to initialize Murder Agent with API key length: {len(NVIDIA_API_KEY) if NVIDIA_API_KEY else 0}")
    murder_agent = MurderAgent(NVIDIA_API_KEY)
    logger.info("Murder Agent initialized successfully in unified server")
except Exception as e:
    logger.error(f"Failed to initialize Murder Agent: {str(e)}")
    logger.error(f"API key details - Length: {len(NVIDIA_API_KEY) if NVIDIA_API_KEY else 0}, Type: {type(NVIDIA_API_KEY)}")
    if NVIDIA_API_KEY:
        logger.error(f"API key starts with: {NVIDIA_API_KEY[:10]}...")
    raise

# Initialize the Financial Agent
financial_agent = None
if FINANCIAL_AGENT_AVAILABLE:
    try:
        logger.info(f"Attempting to initialize Financial Agent with API key length: {len(NVIDIA_API_KEY) if NVIDIA_API_KEY else 0}")
        financial_agent = FinancialFraudAgent(NVIDIA_API_KEY)
        logger.info("Financial Agent initialized successfully in unified server")
    except Exception as e:
        logger.error(f"Failed to initialize Financial Agent: {str(e)}")
        logger.warning("Financial Agent will not be available")
        AGENTS["finance"]["enabled"] = False
else:
    logger.warning("Financial Agent module not available, agent will be disabled")
    AGENTS["finance"]["enabled"] = False

# Initialize the Theft Agent
theft_agent = None
if THEFT_AGENT_AVAILABLE:
    try:
        logger.info(f"Attempting to initialize Theft Agent with API key length: {len(NVIDIA_API_KEY) if NVIDIA_API_KEY else 0}")
        theft_agent = TheftAgent(NVIDIA_API_KEY)
        logger.info("Theft Agent initialized successfully in unified server")
    except Exception as e:
        logger.error(f"Failed to initialize Theft Agent: {str(e)}")
        logger.warning("Theft Agent will not be available")
        AGENTS["theft"]["enabled"] = False
else:
    logger.warning("Theft Agent module not available, agent will be disabled")
    AGENTS["theft"]["enabled"] = False

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

    # Periodically clean up old analysis tracking entries
    cleanup_old_analysis_tracking()

    # Check if analysis is in progress for this session
    if session_id and session_id in analysis_in_progress:
        analysis_info = analysis_in_progress[session_id]
        if analysis_info["status"] == "in_progress":
            logger.info(f"Analysis in progress for session {session_id}, returning status message")
            return jsonify({
                "success": True,
                "data": {
                    "analysis": "Analysis is currently in progress. Please wait for the results...",
                    "is_collecting_info": False,
                    "current_step": "analysis",
                    "collected_data": conversation_states[session_id]["collected_data"] if session_id in conversation_states else {},
                    "error": None
                },
                "session_id": session_id,
                "message": "Analysis in progress"
            })
        elif analysis_info["status"] == "completed" and "analysis_result" in analysis_info:
            logger.info(f"Analysis completed for session {session_id}, returning result")
            analysis_result = analysis_info["analysis_result"]
            # Clean up the analysis tracking
            del analysis_in_progress[session_id]

            return jsonify({
                "success": True,
                "data": {
                    "analysis": analysis_result,
                    "is_collecting_info": False,
                    "current_step": "analysis",
                    "collected_data": conversation_states[session_id]["collected_data"] if session_id in conversation_states else {},
                    "error": None
                },
                "session_id": session_id,
                "message": "Analysis completed successfully"
            })

    # Check if we need to find an active analysis session when session_id is None
    if not session_id and analysis_in_progress:
        # Find the most recent analysis session
        latest_session = None
        latest_time = None
        for analysis_session_id, analysis_info in analysis_in_progress.items():
            if analysis_info["status"] == "in_progress":
                started_at = datetime.fromisoformat(analysis_info["started_at"])
                if latest_time is None or started_at > latest_time:
                    latest_time = started_at
                    latest_session = analysis_session_id

        if latest_session and latest_session in conversation_states:
            logger.info(f"Found active analysis session {latest_session}, using it instead of creating new session")
            session_id = latest_session

            # Check if analysis is complete
            if "analysis_result" in analysis_in_progress[session_id]:
                logger.info(f"Analysis completed for session {session_id}, returning result")
                analysis_result = analysis_in_progress[session_id]["analysis_result"]
                # Clean up the analysis tracking
                del analysis_in_progress[session_id]

                # Return the analysis result
                return jsonify({
                    "success": True,
                    "data": {
                        "analysis": analysis_result,
                        "is_collecting_info": False,
                        "current_step": "analysis",
                        "collected_data": conversation_states[session_id]["collected_data"],
                        "error": None
                    },
                    "session_id": session_id,
                    "message": "Analysis completed successfully"
                })

    # Check if analysis is already completed and stored in conversation state
    if session_id and session_id in conversation_states:
        conv_state = conversation_states[session_id]
        if conv_state.get("analysis_completed") and "analysis_result" in conv_state:
            logger.info(f"Analysis already completed for session {session_id}, returning stored result")
            analysis_result = conv_state["analysis_result"]

            # Clean up analysis tracking if it still exists
            if session_id in analysis_in_progress:
                del analysis_in_progress[session_id]
                logger.info(f"Cleaned up analysis tracking for completed session {session_id}")

            return jsonify({
                "success": True,
                "data": {
                    "analysis": analysis_result,
                    "is_collecting_info": False,
                    "current_step": "completed",
                    "collected_data": conv_state["collected_data"],
                    "error": None
                },
                "session_id": session_id,
                "message": "Analysis completed successfully"
            })

    # Process the message using the new process_message method with the special flags
    session_id, response, is_collecting_info, current_step, error_message = murder_agent.process_message(
        user_input,
        session_id,
        force_new_session=force_new_session,
        reset_conversation=reset_conversation
    )

    # Check if analysis is completed and store the investigation data
    if (current_step == "completed" or current_step == "analysis") and not is_collecting_info and MURDER_STORAGE_AVAILABLE:
        try:
            # Get the collected data from the conversation state
            collected_data = conversation_states[session_id]["collected_data"] if session_id in conversation_states else {}

            if collected_data:
                case_id = collected_data.get('case_id', str(datetime.now().timestamp()))

                # Create conversation pairs from collected data
                conversation_pairs = []
                for field, value in collected_data.items():
                    if field != 'case_id' and value:
                        # Find the corresponding step to get the question
                        for step in CASE_INFO_STEPS:
                            if step.get('field') == field:
                                conversation_pairs.append({
                                    'question': step['message'],
                                    'answer': str(value),
                                    'timestamp': datetime.now().isoformat()
                                })
                                break

                # Prepare user metadata
                user_metadata = {
                    'session_id': session_id,
                    'timestamp': datetime.now().isoformat(),
                    'analysis_completed': True,
                    'backend_source': 'unified_server',
                    'endpoint': '/api/augment/murder'
                }

                logger.info(f"Storing Murder Agent investigation data for case {case_id} (unified server)")

                # Store the investigation data with AI analysis
                murder_storage.store_investigation_data(
                    case_id=case_id,
                    session_id=session_id,
                    extracted_data=collected_data,
                    conversation_pairs=conversation_pairs,
                    ai_analysis=response,  # The response contains the AI analysis
                    user_metadata=user_metadata
                )

                logger.info(f"Successfully stored investigation data for case {case_id} (unified server)")

        except Exception as e:
            logger.error(f"Error storing Murder Agent data in unified server: {e}")
            # Continue with response even if storage fails

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

# Create a specialized endpoint for the Financial Agent
@app.route('/api/augment/finance', methods=['POST'])
def finance_agent_endpoint():
    """Financial Agent API endpoint."""
    logger.info("Received request for Financial Agent")

    # Check if the agent is enabled
    if not AGENTS["finance"]["enabled"]:
        return jsonify({
            "success": False,
            "error": "Financial Agent is not enabled",
            "data": {
                "analysis": "Financial Agent is not enabled. Please enable it in the settings."
            }
        }), 403

    # Check if the financial agent is available
    if not financial_agent:
        return jsonify({
            "success": False,
            "error": "Financial Agent is not available",
            "data": {
                "analysis": "Financial Agent is not available. Please check the server configuration."
            }
        }), 503

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
                "analysis": "Financial Agent is running"
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

    # Process the message using the Financial Agent's process_message method with the special flags
    session_id, response, is_collecting_info, current_step, error_message = financial_agent.process_message(
        user_input,
        session_id,
        force_new_session=force_new_session,
        reset_conversation=reset_conversation
    )

    # Check if analysis is completed and store the investigation data
    if current_step == "analysis" and not is_collecting_info:
        try:
            # Import the finance storage module
            from FinancialAgent.finance_data_storage import finance_storage

            # Get the collected data from the conversation state
            collected_data = financial_agent.conversation_states[session_id]["collected_data"] if session_id in financial_agent.conversation_states else {}

            if collected_data:
                case_id = collected_data.get('case_id', str(datetime.now().timestamp()))

                # Create conversation pairs from collected data
                conversation_pairs = []
                for field, value in collected_data.items():
                    if field != 'case_id' and value:
                        # Find the corresponding step to get the question
                        for step in financial_agent.CASE_INFO_STEPS:
                            if step.get('field') == field:
                                conversation_pairs.append({
                                    'question': step['message'],
                                    'answer': str(value),
                                    'timestamp': datetime.now().isoformat()
                                })
                                break

                # Prepare user metadata
                user_metadata = {
                    'session_id': session_id,
                    'timestamp': datetime.now().isoformat(),
                    'analysis_completed': True,
                    'backend_source': 'unified_server',
                    'endpoint': '/api/augment/finance'
                }

                logger.info(f"Storing Financial Agent investigation data for case {case_id} (unified server)")

                # Store the investigation data with AI analysis
                finance_storage.store_investigation_data(
                    case_id=case_id,
                    session_id=session_id,
                    extracted_data=collected_data,
                    conversation_pairs=conversation_pairs,
                    ai_analysis=response,  # The response contains the AI analysis
                    user_metadata=user_metadata
                )

                logger.info(f"Successfully stored investigation data for case {case_id} (unified server)")

        except Exception as storage_error:
            logger.error(f"Error storing Financial Agent data in unified server: {storage_error}")
            # Continue with response even if storage fails

    # Return the response with the session ID and conversation state
    return jsonify({
        "success": True,
        "data": {
            "analysis": response,
            "is_collecting_info": is_collecting_info,
            "current_step": current_step,
            "collected_data": financial_agent.conversation_states[session_id]["collected_data"] if session_id in financial_agent.conversation_states else {},
            "error": error_message
        },
        "session_id": session_id,
        "message": "Message processed successfully"
    })

# Create a specialized endpoint for the Theft Agent
@app.route('/api/augment/theft', methods=['POST'])
def theft_agent_endpoint():
    """Theft Agent API endpoint."""
    logger.info("Received request for Theft Agent")

    # Check if the agent is enabled
    if not AGENTS["theft"]["enabled"]:
        return jsonify({
            "success": False,
            "error": "Theft Agent is not enabled",
            "data": {
                "analysis": "Theft Agent is not enabled. Please enable it in the settings."
            }
        }), 403

    # Check if the theft agent is available
    if not theft_agent:
        return jsonify({
            "success": False,
            "error": "Theft Agent is not available",
            "data": {
                "analysis": "Theft Agent is not available. Please check the server configuration."
            }
        }), 503

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
                "analysis": "Theft Agent is running"
            },
            "status": "healthy"
        }), 200

    try:
        # Analyze the case using the Theft Agent
        logger.info("Calling Theft Agent for analysis")
        analysis = theft_agent.analyze_case(case_details)

        # Return the response
        return jsonify({
            "success": True,
            "data": {
                "analysis": analysis
            },
            "message": "Theft investigation analysis completed successfully"
        })

    except Exception as e:
        logger.error(f"Error analyzing case with Theft Agent: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Error analyzing case: {str(e)}",
            "data": {
                "analysis": f"Error analyzing case: {str(e)}"
            }
        }), 500

# Create endpoints for other agents
for agent_name, agent_config in AGENTS.items():
    # Skip the murder, finance, and theft agents as we've created specialized endpoints for them
    if agent_name in ["murder", "finance", "theft"]:
        continue

    # Create a closure to capture the agent_name variable
    def create_endpoint(agent):
        def endpoint_func():
            logger.info(f"Received request for {agent} agent")

            # Check if the agent is enabled
            if not AGENTS[agent]["enabled"]:
                return jsonify({"error": f"Agent {agent} is not enabled"}), 403

            # Get case details from request
            case_details = request.json
            if not case_details:
                return jsonify({"error": "No case details provided"}), 400

            # Format the case details into a prompt
            prompt = format_case_details(case_details)

            # Get the system prompt for this agent
            system_prompt = AGENTS[agent]["system_prompt"]

            # Call the NVIDIA API
            response = call_nvidia_api(prompt, system_prompt)

            # Return the response
            return jsonify({"response": response})

        # Set the function name
        endpoint_func.__name__ = f"{agent}_endpoint"
        return endpoint_func

    # Register the route with a unique function for each agent
    app.add_url_rule(
        f"/api/augment/{agent_name}",
        endpoint=f"{agent_name}_endpoint",
        view_func=create_endpoint(agent_name),
        methods=["POST"]
    )

# Health check endpoint
@app.route('/health')
def health_check():
    """Health check endpoint."""
    logger.info("Received GET request for health endpoint")
    return jsonify({
        "status": "healthy",
        "agents": list(AGENTS.keys()),
        "enabled_agents": {name: config["enabled"] for name, config in AGENTS.items()},
        "murder_agent": {
            "status": "integrated",
            "model": MURDER_MODEL_NAME
        },
        "financial_agent": {
            "status": "integrated" if financial_agent else "not_available",
            "available": FINANCIAL_AGENT_AVAILABLE,
            "enabled": AGENTS["finance"]["enabled"]
        },
        "theft_agent": {
            "status": "integrated" if theft_agent else "not_available",
            "available": THEFT_AGENT_AVAILABLE,
            "enabled": AGENTS["theft"]["enabled"]
        }
    })

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
        "financial_agent": {
            "status": "integrated" if financial_agent else "not_available",
            "available": FINANCIAL_AGENT_AVAILABLE,
            "enabled": AGENTS["finance"]["enabled"],
            "api_key_source": "env" if os.getenv('NVIDIA_API_KEY') else (".env file" if retrieve_api_key() else "default")
        },
        "theft_agent": {
            "status": "integrated" if theft_agent else "not_available",
            "available": THEFT_AGENT_AVAILABLE,
            "enabled": AGENTS["theft"]["enabled"],
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

# Endpoint to reset a Finance Agent conversation
@app.route('/api/augment/finance/reset', methods=['POST'])
def finance_agent_reset():
    """Reset a Finance Agent conversation."""
    session_id = request.json.get('session_id')

    logger.info(f"Resetting Finance Agent conversation for session: {session_id}")

    # For Finance Agent, we'll just return a success response since it doesn't use the same
    # conversation state management as the Murder Agent
    return jsonify({
        "success": True,
        "data": {
            "analysis": "Hello, I'm the Financial Fraud Agent, an AI assistant specialized in financial fraud investigations. I'll help you analyze a financial fraud case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
            "is_collecting_info": True,
            "current_step": "greeting"
        },
        "session_id": session_id or "new_session",
        "message": "Finance Agent conversation reset successfully"
    })

# Endpoint to reset a Theft Agent conversation
@app.route('/api/augment/theft/reset', methods=['POST'])
def theft_agent_reset():
    """Reset a Theft Agent conversation."""
    session_id = request.json.get('session_id')

    logger.info(f"Resetting Theft Agent conversation for session: {session_id}")

    # For Theft Agent, we'll just return a success response since it doesn't use the same
    # conversation state management as the Murder Agent
    return jsonify({
        "success": True,
        "data": {
            "analysis": "Hello, I'm the Theft Agent, an AI assistant specialized in theft investigations. I'll help you analyze a theft case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
            "is_collecting_info": True,
            "current_step": "greeting"
        },
        "session_id": session_id or "new_session",
        "message": "Theft Agent conversation reset successfully"
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

# Enhanced PDF Generation endpoint with AI analysis
@app.route('/api/generate-pdf', methods=['POST'])
async def generate_pdf():
    """Generate a PDF report from user data with AI analysis."""
    logger.info("Received request for enhanced PDF generation")
    
    try:
        # Get data from request
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        # Extract title and agent type
        title = data.get('title', 'Investigation Report')
        agent_type = data.get('agent_type', 'murder').lower()
        
        # Map analysis type
        mapped_analysis_type = {
            'murder': 'murder',
            'homicide': 'murder',
            'financial': 'financial',
            'fraud': 'fraud',
            'theft': 'theft'
        }.get(agent_type, 'general')
        
        # Initialize PDF generator with proper waiting
        try:
            from dynamic_pdf_generator import DynamicPDFGenerator
            pdf_generator = DynamicPDFGenerator(NVIDIA_API_KEY)
            
            # Generate the PDF with explicit waiting
            pdf_buffer = await asyncio.to_thread(
                pdf_generator.generate_investigation_pdf,
                data=data,
                analysis_type=mapped_analysis_type
            )
            
            # If this is a murder case, capture the AI analysis with explicit waiting
            if agent_type == 'murder' and MURDER_STORAGE_AVAILABLE:
                try:
                    ai_analysis_content = await asyncio.to_thread(
                        pdf_generator.generate_ai_analysis,
                        data, 
                        mapped_analysis_type
                    )
                    
                    # Update the stored case with the AI analysis
                    case_id = data.get('case_id') or data.get('requestId', str(datetime.now().timestamp()))
                    await asyncio.to_thread(
                        murder_storage.update_ai_analysis,
                        case_id, 
                        ai_analysis_content
                    )
                    logger.info(f"Updated case {case_id} with AI analysis")
                    
                except Exception as e:
                    logger.error(f"Error capturing AI analysis for storage: {e}")
        except ImportError:
            logger.warning("Dynamic PDF generator not available, using fallback")
            # Fallback to existing PDF generation with explicit waiting
            pdf_buffer = await asyncio.to_thread(generate_incident_pdf, data)
            
        # Create a unique filename that doesn't reference local paths
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_title = title.replace(' ', '_').replace('/', '_')[:50]
        filename = f"{safe_title}_{timestamp}.pdf"
        
        # Return the PDF as a file download
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to generate PDF: {str(e)}"
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

# Murder Investigation Data API Endpoints
@app.route('/api/murder-investigations', methods=['GET'])
def get_murder_investigations():
    """Get all stored murder investigation cases."""
    if not MURDER_STORAGE_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "Murder investigation storage not available"
        }), 503

    try:
        cases = murder_storage.get_all_cases()
        metadata = murder_storage.get_storage_metadata()

        return jsonify({
            "success": True,
            "data": {
                "cases": cases,
                "metadata": metadata
            }
        })
    except Exception as e:
        logger.error(f"Error retrieving murder investigations: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve investigations: {str(e)}"
        }), 500

@app.route('/api/murder-investigations/<case_id>', methods=['GET'])
def get_murder_investigation(case_id):
    """Get a specific murder investigation case by ID."""
    if not MURDER_STORAGE_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "Murder investigation storage not available"
        }), 503

    try:
        case_data = murder_storage.get_case_data(case_id)

        if case_data:
            return jsonify({
                "success": True,
                "data": case_data
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Case {case_id} not found"
            }), 404

    except Exception as e:
        logger.error(f"Error retrieving case {case_id}: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve case: {str(e)}"
        }), 500

def extract_structured_investigation_data(messages):
    """
    Extract structured investigation data from Murder Agent's Q&A conversation.
    This function specifically handles the Murder Agent's structured questioning format.
    Ensures 100% dynamic data extraction with no hardcoded content.

    Args:
        messages: List of chat messages from Murder Agent conversation

    Returns:
        Dictionary containing structured investigation data
    """
    extracted_data = {}
    conversation_pairs = []

    logger.info(f"Extracting data from {len(messages)} messages")

    # Parse the conversation into question-answer pairs
    for i in range(len(messages)):
        message = messages[i]

        # Check for Murder Agent questions (assistant messages)
        if (message.get('sender') == 'assistant' and
            (message.get('agentType') == 'murder' or 'Murder Agent' in message.get('content', ''))):

            # Clean up the question by removing formatting markers
            question = message.get('content', '').strip()
            question = question.replace('**[LIVE DATA ANALYSIS]**', '').strip()
            question = question.replace('Murder Agent Live Data Live Data Analysis', '').strip()
            question = question.replace('Please answer the question to continue the investigation.', '').strip()

            # Look for the user's response in the next message
            if i + 1 < len(messages) and messages[i + 1].get('sender') == 'user':
                answer = messages[i + 1].get('content', '').strip()

                if answer:  # Only store non-empty answers
                    conversation_pairs.append({
                        'question': question,
                        'answer': answer,
                        'timestamp': message.get('timestamp')
                    })
                    logger.info(f"Found Q&A pair: {question[:50]}... -> {answer}")

    # Enhanced question mappings to handle all Murder Agent question variations
    question_mappings = {
        # Case ID variations
        'case id': 'case_id',
        'what is the case id': 'case_id',
        'case number': 'case_id',

        # Date and time variations
        'when did the crime occur': 'crime_date',
        'date of the crime': 'crime_date',
        'when did this happen': 'crime_date',
        'date of incident': 'crime_date',

        'what time did the crime occur': 'crime_time',
        'time of the crime': 'crime_time',
        'what time': 'crime_time',
        'time of incident': 'crime_time',

        # Location variations
        'where did the crime take place': 'location',
        'location of the crime': 'location',
        'where did this happen': 'location',
        'crime location': 'location',

        # Victim information variations
        'victim\'s name': 'victim_name',
        'name of the victim': 'victim_name',
        'who is the victim': 'victim_name',
        'victim name': 'victim_name',

        'victim\'s age': 'victim_age',
        'age of the victim': 'victim_age',
        'how old was the victim': 'victim_age',
        'victim age': 'victim_age',

        'victim\'s gender': 'victim_gender',
        'gender of the victim': 'victim_gender',
        'victim gender': 'victim_gender',

        # Crime details variations
        'cause of death': 'cause_of_death',
        'how did the victim die': 'cause_of_death',
        'what was the cause of death': 'cause_of_death',

        'weapon used': 'weapon_used',
        'what weapon was used': 'weapon_used',
        'murder weapon': 'weapon_used',

        # Crime scene variations
        'describe the crime scene': 'crime_scene_description',
        'crime scene description': 'crime_scene_description',
        'what did the crime scene look like': 'crime_scene_description',
        'crime scene': 'crime_scene_description',

        # Evidence and witnesses
        'witnesses': 'witnesses',
        'were there any witnesses': 'witnesses',
        'any witnesses': 'witnesses',

        'evidence': 'evidence_found',
        'what evidence was found': 'evidence_found',
        'evidence found': 'evidence_found',
        'any evidence': 'evidence_found',

        # Suspects
        'suspects': 'suspects',
        'any suspects': 'suspects',
        'who are the suspects': 'suspects',
        'potential suspects': 'suspects',

        # Additional information
        'additional notes': 'additional_notes',
        'anything else': 'additional_notes',
        'other information': 'additional_notes',
        'notes': 'additional_notes'
    }

    # Map answers to structured fields with improved matching
    for pair in conversation_pairs:
        question_lower = pair['question'].lower()
        answer = pair['answer'].strip()

        # Skip empty answers
        if not answer:
            continue

        matched = False
        for key_phrase, field_name in question_mappings.items():
            if key_phrase in question_lower:
                # Only store if we don't already have this field or if this is a better match
                if field_name not in extracted_data:
                    extracted_data[field_name] = answer
                    logger.info(f"Mapped '{key_phrase}' -> {field_name}: {answer}")
                    matched = True
                    break

        # If no specific mapping found, try to infer from question content
        if not matched:
            logger.warning(f"No mapping found for question: {question_lower[:100]}")

    # Store the full conversation for reference
    extracted_data['conversation_pairs'] = conversation_pairs
    extracted_data['total_messages'] = len(messages)
    extracted_data['user_messages'] = len([m for m in messages if m.get('sender') == 'user'])
    extracted_data['assistant_messages'] = len([m for m in messages if m.get('sender') == 'assistant'])

    if messages:
        extracted_data['conversation_start'] = messages[0].get('timestamp')
        extracted_data['conversation_end'] = messages[-1].get('timestamp')

    logger.info(f"Extracted {len(extracted_data)} fields from conversation")
    return extracted_data

def extract_data_from_chat_messages(messages):
    """
    Enhanced extraction of structured data from chat messages for PDF generation.
    Handles both structured Murder Agent conversations and general chat patterns.

    Args:
        messages: List of chat messages

    Returns:
        Dictionary containing extracted data
    """
    # Check if this is a Murder Agent conversation
    is_murder_agent = any(
        'Murder Agent' in message.get('content', '')
        for message in messages
        if message.get('sender') == 'assistant'
    )

    if is_murder_agent:
        # Use structured extraction for Murder Agent conversations
        return extract_structured_investigation_data(messages)

    # Fall back to pattern-based extraction for other conversations
    extracted_data = {}

    # Combine all user messages for comprehensive analysis
    all_user_content = ""
    for message in messages:
        if message.get('sender') == 'user':
            all_user_content += " " + message.get('content', '')

    content_lower = all_user_content.lower()

    # Enhanced extraction patterns
    extraction_patterns = {
        # Basic case information
        'case_id': [
            r'case\s*(?:id|number)[:\s]*([^\s,\n.]+)',
            r'case[:\s]*([A-Z0-9-]+)',
            r'id[:\s]*([A-Z0-9-]+)'
        ],
        'crime_date': [
            r'date\s*(?:of\s*crime|of\s*incident)?[:\s]*(\d{4}-\d{2}-\d{2})',
            r'date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})',
            r'(\d{4}-\d{2}-\d{2})',
            r'(\d{1,2}\/\d{1,2}\/\d{4})',
            r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}'
        ],
        'crime_time': [
            r'time\s*(?:of\s*crime|of\s*incident)?[:\s]*(\d{1,2}:\d{2})',
            r'at\s*(\d{1,2}:\d{2})',
            r'(\d{1,2}:\d{2})',
            r'(noon|midnight|morning|evening|afternoon)'
        ],
        'location': [
            r'location[:\s]*([^.\n]+?)(?:\.|$)',
            r'address[:\s]*([^.\n]+?)(?:\.|$)',
            r'(?:at|in)\s*([^.\n]+?)(?:\.|$)',
            r'street[:\s]*([^.\n]+?)(?:\.|$)'
        ],

        # Victim information
        'victim_name': [
            r'victim\s*name[:\s]*([^,\n.]+)',
            r'victim[:\s]*([^,\n.]+)',
            r'name[:\s]*([^,\n.]+)'
        ],
        'victim_age': [
            r'victim\s*age[:\s]*(\d{1,3})',
            r'age[:\s]*(\d{1,3})',
            r'(\d{1,3})\s*years?\s*old'
        ],
        'victim_gender': [
            r'victim\s*gender[:\s]*(male|female|non-binary)',
            r'gender[:\s]*(male|female|non-binary)',
            r'\b(male|female)\b'
        ],

        # Crime details
        'cause_of_death': [
            r'cause\s*of\s*death[:\s]*([^.\n]+?)(?:\.|$)',
            r'died\s*(?:from|of)[:\s]*([^.\n]+?)(?:\.|$)',
            r'killed\s*(?:by|with)[:\s]*([^.\n]+?)(?:\.|$)',
            r'(shot|stabbed|strangled|poisoned|beaten)'
        ],
        'weapon_used': [
            r'weapon\s*used[:\s]*([^.\n]+?)(?:\.|$)',
            r'weapon[:\s]*([^.\n]+?)(?:\.|$)',
            r'killed\s*with\s*(?:a\s*)?([^.\n]+?)(?:\.|$)',
            r'(gun|knife|pistol|rifle|sword|bat)'
        ],
        'crime_scene_description': [
            r'crime\s*scene[:\s]*([^.\n]+?)(?:\.|$)',
            r'scene\s*description[:\s]*([^.\n]+?)(?:\.|$)',
            r'found\s*(?:in|at)[:\s]*([^.\n]+?)(?:\.|$)'
        ],

        # Evidence and witnesses
        'witnesses': [
            r'witness(?:es)?[:\s]*([^.\n]+?)(?:\.|$)',
            r'saw[:\s]*([^.\n]+?)(?:\.|$)',
            r'heard[:\s]*([^.\n]+?)(?:\.|$)',
            r'(\d+)\s*people'
        ],
        'evidence_found': [
            r'evidence[:\s]*([^.\n]+?)(?:\.|$)',
            r'found[:\s]*([^.\n]+?)(?:\.|$)',
            r'fingerprints[:\s]*([^.\n]+?)(?:\.|$)'
        ],
        'suspects': [
            r'suspect(?:s)?[:\s]*([^.\n]+?)(?:\.|$)',
            r'perpetrator[:\s]*([^.\n]+?)(?:\.|$)',
            r'accused[:\s]*([^.\n]+?)(?:\.|$)'
        ],

        # Additional information
        'additional_notes': [
            r'notes?[:\s]*([^.\n]+?)(?:\.|$)',
            r'additional[:\s]*([^.\n]+?)(?:\.|$)',
            r'also[:\s]*([^.\n]+?)(?:\.|$)'
        ]
    }

    # Extract data using patterns
    for field, patterns in extraction_patterns.items():
        for pattern in patterns:
            match = re.search(pattern, all_user_content, re.IGNORECASE | re.DOTALL)
            if match and field not in extracted_data:
                value = match.group(1).strip()
                # Clean up the extracted value
                value = re.sub(r'\s+', ' ', value)  # Normalize whitespace
                value = value.strip('.,;')  # Remove trailing punctuation
                if value and len(value) > 2:  # Only store meaningful values
                    extracted_data[field] = value
                break

    # Store individual messages for reference
    for index, message in enumerate(messages):
        if message.get('sender') == 'user':
            extracted_data[f'message_{index + 1}'] = message.get('content', '')

    # Add conversation metadata
    extracted_data['total_messages'] = len(messages)
    extracted_data['user_messages'] = len([m for m in messages if m.get('sender') == 'user'])
    extracted_data['assistant_messages'] = len([m for m in messages if m.get('sender') == 'assistant'])

    if messages:
        extracted_data['conversation_start'] = messages[0].get('timestamp')
        extracted_data['conversation_end'] = messages[-1].get('timestamp')

    return extracted_data

if __name__ == "__main__":
    try:
        logger.info(f"Starting unified agent server on port {MAIN_PORT}")
        logger.info(f"Murder storage available: {MURDER_STORAGE_AVAILABLE}")
        logger.info(f"ReportLab available: {REPORTLAB_AVAILABLE}")
        logger.info(f"OpenAI available: {OPENAI_AVAILABLE}")

        # Test basic functionality
        logger.info("Testing basic server functionality...")

        # Enable debug mode for development
        logger.info("Server starting successfully...")
        app.run(host="0.0.0.0", port=MAIN_PORT, debug=True)

    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        print(f"ERROR: Failed to start server: {e}")
        print("Please check the logs for more details.")
        sys.exit(1)
