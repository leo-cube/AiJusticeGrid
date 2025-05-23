#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script specifically for the date_of_crime step in the Murder Agent.

This script tests the date_of_crime step to ensure it properly advances
to the next step after receiving a valid date.
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

def test_date_step():
    """Test the date_of_crime step specifically."""
    print("Starting date step test...")
    
    # Start a new conversation
    try:
        # Step 1: Start the conversation
        print("Step 1: Starting conversation...")
        response = requests.post(
            MURDER_AGENT_API_URL,
            json={"question": ""}
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return
        
        response_data = response.json()
        print_response(response_data)
        
        session_id = response_data.get('session_id')
        current_step = response_data.get('data', {}).get('current_step')
        
        if not session_id:
            print("Failed to get session ID")
            return
            
        print(f"Session ID: {session_id}")
        print(f"Current step: {current_step}")
        
        # Step 2: Send case ID
        print("\nStep 2: Sending case ID...")
        response = requests.post(
            MURDER_AGENT_API_URL,
            json={
                "question": "CASE-2023-001",
                "session_id": session_id
            }
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return
        
        response_data = response.json()
        print_response(response_data)
        
        current_step = response_data.get('data', {}).get('current_step')
        print(f"Current step after sending case ID: {current_step}")
        
        # Step 3: Send date
        print("\nStep 3: Sending date...")
        response = requests.post(
            MURDER_AGENT_API_URL,
            json={
                "question": "2000-05-11",
                "session_id": session_id
            }
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return
        
        response_data = response.json()
        print_response(response_data)
        
        current_step = response_data.get('data', {}).get('current_step')
        print(f"Current step after sending date: {current_step}")
        
        # Check if we moved to the next step
        if current_step == "date_of_crime":
            print("\nERROR: Still stuck on date_of_crime step!")
        elif current_step == "time_of_crime":
            print("\nSUCCESS: Moved to time_of_crime step!")
        else:
            print(f"\nUnexpected step: {current_step}")
        
    except Exception as e:
        print(f"Error in test: {str(e)}")

if __name__ == "__main__":
    test_date_step()
