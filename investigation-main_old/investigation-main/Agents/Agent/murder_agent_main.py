#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Murder Agent - Main Interface

This is the main file that interacts with the NVIDIA Llama-3.1-Nemotron-Ultra-253B model
trained on murder datasets to provide solutions based on user-provided case data.

Usage:
    python murder_agent_main.py
    python murder_agent_main.py --api  # Run as API server

Author: Augment Agent
"""

import os
import argparse
import logging
import json
import time
import uuid
from typing import Dict, Any
from pathlib import Path
from datetime import datetime
from openai import OpenAI
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("murder_agent.log"),
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

# Define the case information collection steps
CASE_INFO_STEPS = [
    {
        "id": "greeting",
        "message": "Hello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. I'll help you analyze a murder case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
        "field": None,
        "next_step": "case_id"
    },
    {
        "id": "case_id",
        "message": "Thank you. When did the crime occur? Please provide the date (YYYY-MM-DD).",
        "field": "case_id",
        "next_step": "date_of_crime"
    },
    {
        "id": "date_of_crime",
        "message": "What time did the crime occur? (HH:MM format, or approximate time)",
        "field": "date_of_crime",
        "next_step": "time_of_crime"
    },
    {
        "id": "time_of_crime",
        "message": "Where did the crime take place? Please provide the location.",
        "field": "time_of_crime",
        "next_step": "location"
    },
    {
        "id": "location",
        "message": "What is the victim's name?",
        "field": "location",
        "next_step": "victim_name"
    },
    {
        "id": "victim_name",
        "message": "What is the victim's age?",
        "field": "victim_name",
        "next_step": "victim_age"
    },
    {
        "id": "victim_age",
        "message": "What is the victim's gender?",
        "field": "victim_age",
        "next_step": "victim_gender"
    },
    {
        "id": "victim_gender",
        "message": "What was the cause of death?",
        "field": "victim_gender",
        "next_step": "cause_of_death"
    },
    {
        "id": "cause_of_death",
        "message": "Was a weapon used? If so, what kind?",
        "field": "cause_of_death",
        "next_step": "weapon_used"
    },
    {
        "id": "weapon_used",
        "message": "Please describe the crime scene.",
        "field": "weapon_used",
        "next_step": "crime_scene_description"
    },
    {
        "id": "crime_scene_description",
        "message": "Were there any witnesses? If so, please provide details.",
        "field": "crime_scene_description",
        "next_step": "witnesses"
    },
    {
        "id": "witnesses",
        "message": "What evidence was found at the scene?",
        "field": "witnesses",
        "next_step": "evidence_found"
    },
    {
        "id": "evidence_found",
        "message": "Are there any suspects at this time?",
        "field": "evidence_found",
        "next_step": "suspects"
    },
    {
        "id": "suspects",
        "message": "Do you have any additional notes or information about the case?",
        "field": "suspects",
        "next_step": "additional_notes"
    },
    {
        "id": "additional_notes",
        "message": "Thank you for providing all the case details. I'll now analyze this information and provide you with a comprehensive report.",
        "field": "additional_notes",
        "next_step": "analysis"
    },
    {
        "id": "analysis",
        "message": None,  # This will be replaced with the actual analysis
        "field": None,
        "next_step": None
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

# Helper function to store user input in the conversation state
def store_user_input(session_id, step_id, user_input):
    """Store user input in the conversation state."""
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found in conversation states")
        return False

    # Get the current step
    current_step = get_step_by_id(step_id)
    if not current_step:
        logger.error(f"Step ID {step_id} not found in CASE_INFO_STEPS")
        return False

    # Store the user input if this step has a field
    if current_step["field"]:
        # Get the correct field name for storing the data
        field_name = FIELD_NAMES.get(current_step["field"], current_step["field"])

        # Store the user input in the correct field
        conversation_states[session_id]["collected_data"][field_name] = user_input
        logger.info(f"Stored user input in field {field_name}: {user_input}")

    return True

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
def process_user_input(session_id, user_input):
    """Process user input and update the conversation state."""
    if session_id not in conversation_states:
        logger.error(f"Session ID {session_id} not found in conversation states")
        # Create a new session if the session ID doesn't exist
        new_session_id, conv_state = get_or_create_conversation_state(None)
        logger.info(f"Created new session {new_session_id} for non-existent session {session_id}")
        return new_session_id, conv_state

    # Get the current conversation state
    conv_state = conversation_states[session_id]
    current_step_id = conv_state["current_step"]

    # Log the current state and user input
    logger.info(f"Processing user input for session {session_id}, step {current_step_id}: {user_input}")
    logger.info(f"Current conversation state: {conv_state}")

    # Store the user input
    store_result = store_user_input(session_id, current_step_id, user_input)
    if not store_result:
        logger.error(f"Failed to store user input: {user_input}")
        return session_id, conv_state  # Return the current state even if storage failed

    # Advance to the next step
    advance_result = advance_to_next_step(session_id, current_step_id)
    if not advance_result:
        logger.error(f"Failed to advance to next step from {current_step_id}")
        # This is not a fatal error, so we continue

    # Return the updated conversation state
    return session_id, conversation_states[session_id]

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
        self.api_key = api_key
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        logger.info(f"Murder Agent initialized with model: {MODEL_NAME}")

    def analyze_case(self, case_details):
        """
        Analyze a murder case using the NVIDIA model.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Analysis and solutions for the case
        """
        logger.info("Analyzing case")

        # Format the case details into a prompt
        prompt = self._format_case_prompt(case_details)

        try:
            # Call the NVIDIA API with the real API key
            logger.info("Calling NVIDIA API for analysis")

            system_prompt = "You are a Murder Agent, an AI assistant specialized in analyzing and solving murder cases. Provide detailed analysis, insights, and investigative approaches based solely on the case details provided. Focus on the specific information given and avoid making assumptions beyond what's in the data."

            response = self.client.chat.completions.create(
                model="nvidia/llama-3.1-nemotron-ultra-253b-v1",
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

    def process_message(self, message, session_id=None, force_new_session=False, reset_conversation=False):
        """
        Process a message from the user and update the conversation state.

        Args:
            message: The user's message
            session_id: Optional session ID for continuing a conversation
            force_new_session: Force creation of a new session regardless of existing session
            reset_conversation: Reset the conversation state but keep the session ID

        Returns:
            Tuple of (session_id, response_message, is_collecting_info, current_step)
        """
        logger.info(f"Processing message: {message} with session_id: {session_id}")
        logger.info(f"force_new_session: {force_new_session}, reset_conversation: {reset_conversation}")

        # Check for special commands
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
            return session_id, current_step["message"], True, "greeting"

        # Create a new session if none exists
        if not session_id or session_id not in conversation_states:
            logger.info(f"Creating new session (old session_id: {session_id})")
            session_id = create_new_conversation_state()
            logger.info(f"Created new session: {session_id}")

            # If this is a new session and there's no message, return the greeting
            if not message:
                current_step = get_step_by_id("greeting")
                return session_id, current_step["message"], True, "greeting"

        # Get the current conversation state
        conv_state = conversation_states[session_id]
        current_step_id = conv_state["current_step"]

        logger.info(f"Current step: {current_step_id}")
        logger.info(f"Current conversation state: {conv_state}")

        # If this is the first message (greeting), just return the greeting
        if current_step_id == "greeting" and not message:
            logger.info("First message (greeting), returning greeting message")
            return session_id, get_step_by_id("greeting")["message"], True, "greeting"

        # Process the user input and update the conversation state
        if message:
            # Update the conversation state with the user's input
            session_id, updated_state = process_user_input(session_id, message)

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
                    return session_id, analysis, False, "analysis"
                except Exception as e:
                    logger.error(f"Error analyzing case: {str(e)}")
                    return session_id, f"Error analyzing case: {str(e)}", False, "analysis"

            # Return the next question
            if current_step and current_step["message"]:
                return session_id, current_step["message"], True, current_step_id

        # If we've reached this point, something went wrong
        # Return the current step's question
        current_step = get_step_by_id(current_step_id)
        return session_id, current_step["message"] if current_step else "What would you like to know?", True, current_step_id

    def _generate_simulated_analysis(self, case_details):
        """
        Generate a simulated analysis based on the case details.
        This is a placeholder for the actual NVIDIA API response.

        Args:
            case_details: Dictionary containing case details

        Returns:
            Simulated analysis
        """
        # Extract key details
        victim_name = case_details.get("victim_name", "the victim")
        victim_age = case_details.get("victim_age", "unknown age")
        victim_gender = case_details.get("victim_gender", "unknown gender")
        cause_of_death = case_details.get("cause_of_death", "unknown cause")
        weapon_used = case_details.get("weapon_used", "unknown weapon")
        location = case_details.get("location", "the crime scene")
        crime_scene_desc = case_details.get("crime_scene_description", "")
        suspects = case_details.get("suspects", "No suspects identified yet")
        evidence = case_details.get("evidence_found", "No evidence reported")

        # Build a dynamic analysis based on the specific case details
        analysis = "# MURDER CASE ANALYSIS\n\n"

        # Case overview
        analysis += "## Case Overview\n"
        analysis += f"This case involves the death of {victim_name}"
        if victim_age != "unknown age":
            analysis += f", a {victim_age}-year-old {victim_gender.lower()}"
        analysis += f", at {location}. "
        analysis += f"The cause of death is {cause_of_death.lower()}"
        if weapon_used != "unknown weapon":
            analysis += f", with {weapon_used.lower()} identified as the weapon"
        analysis += ".\n\n"

        # Crime scene analysis
        if crime_scene_desc:
            analysis += "## Crime Scene Analysis\n"
            analysis += f"{crime_scene_desc}\n\n"

            # Add specific insights based on the crime scene description
            if "forced entry" in crime_scene_desc.lower():
                analysis += "The evidence of forced entry suggests the perpetrator was not known to the victim or did not have authorized access.\n\n"
            elif "no signs of forced entry" in crime_scene_desc.lower():
                analysis += "The lack of forced entry suggests the victim may have known the perpetrator or willingly allowed them entry.\n\n"

            if "struggle" in crime_scene_desc.lower():
                analysis += "The signs of struggle indicate the victim was aware of the attack and attempted to resist.\n\n"

        # Weapon analysis
        if weapon_used != "unknown weapon":
            analysis += "## Weapon Analysis\n"
            if "gun" in weapon_used.lower() or "firearm" in weapon_used.lower():
                analysis += "The use of a firearm indicates:\n"
                analysis += "- Possible premeditation, as the perpetrator brought the weapon to the scene\n"
                analysis += "- The need for ballistic analysis to determine if the weapon has been used in other crimes\n"
                analysis += "- A likely intent to ensure lethality\n\n"
            elif "knife" in weapon_used.lower():
                analysis += "The use of a knife indicates:\n"
                analysis += "- Possible crime of passion or opportunity\n"
                analysis += "- The need for forensic analysis for DNA or fingerprints\n"
                analysis += "- A close-proximity attack indicating the perpetrator was able to get near the victim\n\n"
            elif "poison" in weapon_used.lower():
                analysis += "The use of poison indicates:\n"
                analysis += "- Significant premeditation and planning\n"
                analysis += "- The need for toxicology analysis to identify the specific substance\n"
                analysis += "- The perpetrator likely had access to the victim's food or drink\n\n"
            else:
                analysis += f"The use of {weapon_used} requires detailed forensic analysis to determine its significance in this case.\n\n"

        # Suspect analysis
        if suspects != "No suspects identified yet":
            analysis += "## Suspect Analysis\n"
            analysis += f"Based on the information provided, the following suspects should be investigated: {suspects}\n\n"

            # Add specific insights based on the suspects
            if "partner" in suspects.lower() or "spouse" in suspects.lower():
                analysis += "Domestic relationships are statistically significant in homicide cases. The partner/spouse should be thoroughly interviewed and their alibi verified.\n\n"

            if "business" in suspects.lower():
                analysis += "Financial motives should be thoroughly investigated, including any recent business disputes or financial transactions.\n\n"

            if "ex" in suspects.lower():
                analysis += "Past relationships can be a source of conflict. Any history of threats, violence, or stalking should be documented.\n\n"

        # Evidence analysis
        if evidence != "No evidence reported":
            analysis += "## Evidence Analysis\n"
            analysis += f"Key evidence in this case includes: {evidence}\n\n"

            # Add specific insights based on the evidence
            if "fingerprint" in evidence.lower():
                analysis += "Fingerprint evidence should be prioritized for analysis and comparison against databases and suspects.\n\n"

            if "dna" in evidence.lower():
                analysis += "DNA evidence should be expedited for analysis and comparison against suspects.\n\n"

            if "phone" in evidence.lower() or "computer" in evidence.lower() or "email" in evidence.lower():
                analysis += "Digital forensics should be conducted to extract communications, location data, and other relevant information.\n\n"

            if "cctv" in evidence.lower() or "camera" in evidence.lower() or "video" in evidence.lower():
                analysis += "Video evidence should be carefully analyzed to identify suspects and establish a timeline.\n\n"

        # Recommended investigative approaches
        analysis += "## Recommended Investigative Approaches\n"
        analysis += "1. **Witness Interviews**: "
        if "witness" in case_details.get("witnesses", "").lower():
            analysis += f"All witnesses mentioned ({case_details.get('witnesses')}) should be thoroughly interviewed.\n"
        else:
            analysis += "Canvass the area for potential witnesses who may have seen or heard something relevant.\n"

        analysis += "2. **Forensic Analysis**: "
        if evidence != "No evidence reported":
            analysis += f"Prioritize analysis of the collected evidence, particularly {evidence.split(',')[0] if ',' in evidence else evidence}.\n"
        else:
            analysis += "Conduct a thorough forensic examination of the crime scene to collect any overlooked evidence.\n"

        analysis += "3. **Suspect Investigation**: "
        if suspects != "No suspects identified yet":
            analysis += f"Focus on the identified suspects, particularly verifying alibis and establishing motives.\n"
        else:
            analysis += "Develop a list of potential suspects based on victim relationships and conflicts.\n"

        analysis += "4. **Timeline Construction**: Create a detailed timeline of events leading up to the crime.\n"

        analysis += "5. **Victimology**: Conduct a thorough analysis of the victim's background, relationships, and recent activities.\n\n"

        # Conclusion
        analysis += "## Conclusion\n"
        analysis += "Based solely on the information provided in this case, "

        if "no signs of forced entry" in crime_scene_desc.lower():
            analysis += "this appears to be a crime committed by someone known to the victim. "
        elif "forced entry" in crime_scene_desc.lower():
            analysis += "this appears to be a crime committed by an intruder. "

        if weapon_used != "unknown weapon":
            if "gun" in weapon_used.lower():
                analysis += "The use of a firearm suggests premeditation. "
            elif "knife" in weapon_used.lower():
                analysis += "The use of a knife may indicate a crime of passion or opportunity. "

        analysis += "\n\nThe investigation should focus on "

        if suspects != "No suspects identified yet":
            analysis += f"the identified suspects, particularly {suspects.split(',')[0] if ',' in suspects else suspects}, "
        else:
            analysis += "developing a list of potential suspects based on the victim's relationships and conflicts, "

        analysis += "while thoroughly analyzing the available evidence and establishing a clear timeline of events."

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

    def interactive_session(self):
        """
        Start an interactive session with the Murder Agent.
        """
        print("\n" + "="*50)
        print("Welcome to the Murder Agent")
        print("This is a conversational interface for murder case analysis")
        print("Type 'exit' to end the session, 'reset' to start over")
        print("="*50 + "\n")

        # Create a new session
        session_id = create_new_conversation_state()

        # Get the greeting message
        greeting_step = get_step_by_id("greeting")
        print(greeting_step["message"])

        while True:
            # Get user input
            user_input = input("\n> ")

            # Check for exit command
            if user_input.lower() == "exit":
                break

            # Process the message
            session_id, response, is_collecting_info, current_step = self.process_message(user_input, session_id)

            # Print the response
            print("\n" + response)

            # If we've reached the analysis step, ask if the user wants to save the analysis
            if current_step == "analysis":
                save_option = input("\nWould you like to save this analysis? (y/n): ")
                if save_option.lower() == 'y':
                    # Get the collected data
                    collected_data = conversation_states[session_id]["collected_data"]
                    case_id = collected_data.get("case_id", f"case_{int(time.time())}")
                    filename = f"analysis_{case_id}.txt"

                    with open(filename, "w") as f:
                        f.write("CASE DETAILS:\n")
                        f.write("="*50 + "\n")
                        for key, value in collected_data.items():
                            f.write(f"{key.replace('_', ' ').title()}: {value}\n")

                        f.write("\nANALYSIS:\n")
                        f.write("="*50 + "\n")
                        f.write(response)

                    print(f"Analysis saved to {filename}")

                # Reset the conversation state for a new case
                session_id = create_new_conversation_state()
                greeting_step = get_step_by_id("greeting")
                print("\n" + "="*50)
                print("Starting a new case. " + greeting_step["message"])

        print("\nThank you for using the Murder Agent. Goodbye!")

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

def analyze_sample_case(agent):
    """
    Analyze a sample murder case to demonstrate the Murder Agent.

    Args:
        agent: Initialized MurderAgent instance
    """
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

    print("\n" + "="*50)
    print("MURDER AGENT SAMPLE CASE")
    print("="*50 + "\n")

    print("Analyzing sample murder case...")
    print("\nCase Details:")
    for key, value in sample_case.items():
        print(f"{key.replace('_', ' ').title()}: {value}")

    # Analyze the case
    analysis = agent.analyze_case(sample_case)

    print("\n" + "="*50)
    print("MURDER AGENT ANALYSIS")
    print("="*50)
    print(analysis)
    print("="*50)

    # Save the analysis
    filename = "sample_case_analysis.txt"
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
    Run the Murder Agent as an API server.

    Args:
        api_key: NVIDIA API key
    """
    # Initialize Flask app
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    # Initialize the Murder Agent
    agent = MurderAgent(api_key)
    logger.info("Murder Agent API server initialized")

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        return jsonify({"status": "healthy", "agent": "murder"})

    @app.route('/api/augment/murder', methods=['POST'])
    def murder_endpoint():
        """Murder Agent API endpoint."""
        logger.info("Received request for Murder Agent")

        # Get case details from request
        case_details = request.json
        if not case_details:
            return jsonify({"error": "No case details provided"}), 400

        # Check if this is just a ping/health check
        if case_details.get("question") == "ping":
            return jsonify({"response": "Murder Agent is running", "status": "healthy"}), 200

        # Get the session ID and user input from the request
        session_id = case_details.get("session_id")
        user_input = case_details.get("question", "")

        logger.info(f"Received request with session_id: {session_id}, user_input: {user_input}")

        # Process the message using the new conversation state management
        session_id, response, is_collecting_info, current_step = agent.process_message(user_input, session_id)

        # Return the response with the session ID and conversation state
        return jsonify({
            "success": True,
            "data": {
                "analysis": response,
                "is_collecting_info": is_collecting_info,
                "current_step": current_step,
                "collected_data": conversation_states[session_id]["collected_data"] if session_id in conversation_states else {}
            },
            "session_id": session_id,
            "message": "Message processed successfully"
        })

    # Add an endpoint to get the current conversation state
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

    # Add an endpoint to reset a conversation
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

    # Run the Flask app
    logger.info("Starting Murder Agent API server on port 5000")
    app.run(host="0.0.0.0", port=5000)

def main():
    """Main function to run the Murder Agent."""
    parser = argparse.ArgumentParser(description="Murder Agent")
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

    # Initialize the Murder Agent
    agent = MurderAgent(api_key)

    # Analyze sample case if requested
    if args.sample:
        analyze_sample_case(agent)
        return

    # Start interactive session
    agent.interactive_session()

if __name__ == "__main__":
    main()
