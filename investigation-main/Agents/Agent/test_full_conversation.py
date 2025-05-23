#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for the full Murder Agent conversation flow.

This script tests the entire conversation flow from start to finish,
ensuring that each step is properly handled and the agent advances
through all steps correctly.
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
            return None, None
        
        response_data = response.json()
        print_response(response_data)
        
        # Return the updated session ID and current step
        return response_data.get('session_id'), response_data.get('data', {}).get('current_step')
    
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return None, None

def test_full_conversation():
    """Test the full conversation flow."""
    print("Starting full conversation test...")
    
    # Start the conversation
    try:
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
        
        # Sample responses for each step
        responses = {
            "greeting": "CASE-2023-001",
            "case_id": "2000-05-11",
            "date_of_crime": "22:30",
            "time_of_crime": "123 Main Street, Apartment 4B",
            "location": "John Doe",
            "victim_name": "35",
            "victim_age": "Male",
            "victim_gender": "Gunshot wound to the chest",
            "cause_of_death": "Handgun",
            "weapon_used": "Victim found in living room. Signs of struggle.",
            "crime_scene_description": "Neighbor heard gunshot around 22:30",
            "witnesses": "Bullet casing, fingerprints on door handle",
            "evidence_found": "Ex-girlfriend with history of threats",
            "suspects": "Victim recently filed a restraining order"
        }
        
        # Send responses for each step
        while current_step and current_step != "analysis":
            if current_step not in responses:
                print(f"No response defined for step: {current_step}")
                break
                
            response = responses[current_step]
            session_id, current_step = send_message(session_id, response)
            
            if not session_id or not current_step:
                print("Failed to get response")
                break
                
            print(f"Advanced to step: {current_step}")
            time.sleep(1)  # Wait a bit between requests
        
        if current_step == "analysis":
            print("\nSuccessfully completed all steps!")
        else:
            print(f"\nFailed to complete all steps. Stopped at: {current_step}")
        
    except Exception as e:
        print(f"Error in test: {str(e)}")

if __name__ == "__main__":
    test_full_conversation()
