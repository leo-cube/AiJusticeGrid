#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for the Murder Agent Backend

This script tests the Murder Agent backend by simulating a conversation
with the agent and verifying that it correctly processes user inputs
and advances through the conversation steps.

Usage:
    python test_murder_agent.py

Author: Augment Agent
"""

import requests
import json
import time
import sys

# Configuration
BASE_URL = "http://localhost:5001"  # Use the port defined in murder_agent_backend.py
MURDER_ENDPOINT = f"{BASE_URL}/api/augment/murder"
STATE_ENDPOINT = f"{BASE_URL}/api/augment/murder/state"
RESET_ENDPOINT = f"{BASE_URL}/api/augment/murder/reset"

def print_separator():
    """Print a separator line."""
    print("\n" + "="*80 + "\n")

def test_conversation():
    """Test a complete conversation with the Murder Agent."""
    print("Starting Murder Agent conversation test...")
    print_separator()

    # Start a new conversation
    session_id = None
    
    # Step 1: Say hello to get the greeting
    print("Step 1: Greeting")
    response = send_message("hi", session_id)
    session_id = response.get("session_id")
    print(f"Agent: {response['data']['analysis']}")
    print(f"Session ID: {session_id}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 2: Provide case ID
    print("Step 2: Provide case ID")
    response = send_message("CASE-12345", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 3: Provide date (test with different formats)
    print("Step 3: Provide date")
    response = send_message("2023-05-15", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 4: Provide time
    print("Step 4: Provide time")
    response = send_message("22:30", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 5: Provide location
    print("Step 5: Provide location")
    response = send_message("123 Main Street, Apartment 4B", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 6: Provide victim name
    print("Step 6: Provide victim name")
    response = send_message("John Doe", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 7: Provide victim age
    print("Step 7: Provide victim age")
    response = send_message("35", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 8: Provide victim gender
    print("Step 8: Provide victim gender")
    response = send_message("Male", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 9: Provide cause of death
    print("Step 9: Provide cause of death")
    response = send_message("Gunshot wound to the chest", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 10: Provide weapon used
    print("Step 10: Provide weapon used")
    response = send_message("9mm handgun", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 11: Provide crime scene description
    print("Step 11: Provide crime scene description")
    response = send_message("The victim was found in the living room, lying face down. The room was in disarray, suggesting a struggle.", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 12: Provide witnesses
    print("Step 12: Provide witnesses")
    response = send_message("A neighbor reported hearing a gunshot around 10:30 PM.", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 13: Provide evidence found
    print("Step 13: Provide evidence found")
    response = send_message("A 9mm shell casing, fingerprints on the doorknob, and a threatening note.", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 14: Provide suspects
    print("Step 14: Provide suspects")
    response = send_message("The victim's business partner, who had a financial dispute with him.", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 15: Provide additional notes
    print("Step 15: Provide additional notes")
    response = send_message("The victim had recently filed for bankruptcy and was involved in a lawsuit.", session_id)
    print(f"Agent: {response['data']['analysis']}")
    print(f"Current step: {response['data']['current_step']}")
    print_separator()
    
    # Step 16: Get the analysis
    print("Step 16: Get the analysis")
    # The analysis should be automatically provided after the additional notes
    if response['data']['current_step'] == "analysis":
        print("Analysis received:")
        print(response['data']['analysis'])
    else:
        print("Error: Did not receive analysis after providing all information.")
    print_separator()
    
    # Check the final state
    print("Final conversation state:")
    state_response = get_conversation_state(session_id)
    print(json.dumps(state_response, indent=2))
    print_separator()
    
    print("Test completed!")

def send_message(message, session_id=None):
    """Send a message to the Murder Agent and return the response."""
    payload = {
        "question": message
    }
    
    if session_id:
        payload["session_id"] = session_id
        
    try:
        response = requests.post(MURDER_ENDPOINT, json=payload)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error sending message: {e}")
        sys.exit(1)

def get_conversation_state(session_id):
    """Get the current conversation state."""
    try:
        response = requests.get(f"{STATE_ENDPOINT}?session_id={session_id}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting conversation state: {e}")
        sys.exit(1)

def reset_conversation(session_id):
    """Reset the conversation."""
    try:
        response = requests.post(RESET_ENDPOINT, json={"session_id": session_id})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error resetting conversation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_conversation()
