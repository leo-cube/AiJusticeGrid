#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for the fixed Murder Agent API.

This script tests the step-by-step case information collection process
with a focus on the date_of_crime step that was previously causing issues.
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

def test_date_step():
    """Test the date_of_crime step specifically."""
    # Start the conversation
    session_id = start_conversation()
    if not session_id:
        print("Failed to start conversation")
        return
    
    # Send the case ID
    session_id = send_message(session_id, "CASE-2023-001")
    if not session_id:
        print("Failed to send case ID")
        return
    
    # Send the date (this was causing issues before)
    session_id = send_message(session_id, "2000-05-11")
    if not session_id:
        print("Failed to send date")
        return
    
    # Check if we moved to the next step (time_of_crime)
    # If we're still on date_of_crime, the fix didn't work
    print("\nChecking if we moved to the next step...")
    
    # Get the current state
    try:
        response = requests.get(
            f"http://localhost:5000/api/augment/murder/state?session_id={session_id}"
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return
        
        response_data = response.json()
        current_step = response_data.get('data', {}).get('current_step')
        
        if current_step == "date_of_crime":
            print("ERROR: Still stuck on date_of_crime step!")
        elif current_step == "time_of_crime":
            print("SUCCESS: Moved to time_of_crime step!")
        else:
            print(f"Current step: {current_step}")
        
    except Exception as e:
        print(f"Error checking state: {str(e)}")

if __name__ == "__main__":
    test_date_step()
