#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for the interactive Murder Agent API.

This script simulates a conversation with the Murder Agent API
to test the step-by-step case information collection process.
"""

import requests
import json
import time

# Murder Agent API URL
MURDER_AGENT_API_URL = "http://localhost:5000/api/augment/murder"

def print_response(response_data):
    """Print the response data in a readable format."""
    print("\nResponse:")
    print(f"Success: {response_data.get('success', False)}")
    print(f"Session ID: {response_data.get('session_id', 'None')}")
    
    data = response_data.get('data', {})
    print(f"Analysis: {data.get('analysis', 'None')}")
    print(f"Is Collecting Info: {data.get('is_collecting_info', False)}")
    print(f"Current Step: {data.get('current_step', 'None')}")
    
    collected_data = data.get('collected_data', {})
    if collected_data:
        print("\nCollected Data:")
        for key, value in collected_data.items():
            print(f"  {key}: {value}")

def start_conversation():
    """Start a conversation with the Murder Agent."""
    print("Starting conversation with Murder Agent...")
    
    try:
        # Send an empty question to start the conversation
        response = requests.post(
            MURDER_AGENT_API_URL,
            json={"question": ""}
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return None
        
        response_data = response.json()
        print_response(response_data)
        
        # Return the session ID
        return response_data.get('session_id')
    
    except Exception as e:
        print(f"Error starting conversation: {str(e)}")
        return None

def send_message(session_id, message):
    """Send a message to the Murder Agent."""
    print(f"\nSending message: {message}")
    
    try:
        # Send the message
        response = requests.post(
            MURDER_AGENT_API_URL,
            json={
                "question": message,
                "session_id": session_id
            }
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return None
        
        response_data = response.json()
        print_response(response_data)
        
        # Return the updated session ID
        return response_data.get('session_id')
    
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return None

def simulate_conversation():
    """Simulate a conversation with the Murder Agent."""
    # Start the conversation
    session_id = start_conversation()
    if not session_id:
        print("Failed to start conversation")
        return
    
    # Sample responses for each step
    responses = [
        "CASE-2023-001",  # Case ID
        "2023-11-15",     # Date of Crime
        "22:30",          # Time of Crime
        "123 Main Street, Apartment 4B",  # Location
        "John Doe",       # Victim Name
        "35",             # Victim Age
        "Male",           # Victim Gender
        "Gunshot wound to the chest",  # Cause of Death
        "Handgun",        # Weapon Used
        "Victim found in living room. Signs of struggle.",  # Crime Scene Description
        "Neighbor heard gunshot around 22:30",  # Witnesses
        "Bullet casing, fingerprints on door handle",  # Evidence Found
        "Ex-girlfriend with history of threats",  # Suspects
        "Victim recently filed a restraining order"  # Additional Notes
    ]
    
    # Send each response with a delay
    for response in responses:
        time.sleep(2)  # Wait 2 seconds between messages
        session_id = send_message(session_id, response)
        if not session_id:
            print("Conversation ended unexpectedly")
            return
    
    print("\nConversation completed successfully!")

if __name__ == "__main__":
    simulate_conversation()
