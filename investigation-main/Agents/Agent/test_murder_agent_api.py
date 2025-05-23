#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for the Murder Agent API in the unified server.

This script sends a test request to the Murder Agent API endpoint
to verify that it's working correctly.
"""

import requests
import json
import sys

# Murder Agent API URL
MURDER_AGENT_API_URL = "http://localhost:5000/api/augment/murder"

def test_ping():
    """Test the ping endpoint."""
    print("Testing ping endpoint...")

    payload = {
        "question": "ping"
    }

    try:
        response = requests.post(MURDER_AGENT_API_URL, json=payload)

        if response.status_code == 200:
            data = response.json()
            print("Ping successful!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def test_question():
    """Test a simple question."""
    print("\nTesting question endpoint...")

    payload = {
        "question": "What are the key steps in a murder investigation?"
    }

    try:
        response = requests.post(MURDER_AGENT_API_URL, json=payload)

        if response.status_code == 200:
            data = response.json()
            print("Question successful!")
            print(f"Response format: {list(data.keys())}")
            print(f"Success: {data.get('success', False)}")
            if 'data' in data and 'analysis' in data['data']:
                print(f"Analysis (first 100 chars): {data['data']['analysis'][:100]}...")
            else:
                print("No analysis found in response")
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def test_sample_case():
    """Test the sample case endpoint."""
    print("\nTesting sample case endpoint...")

    try:
        response = requests.get(f"{MURDER_AGENT_API_URL}/sample")

        if response.status_code == 200:
            data = response.json()
            print("Sample case successful!")
            print(f"Response format: {list(data.keys())}")
            print(f"Success: {data.get('success', False)}")
            if 'data' in data and 'analysis' in data['data']:
                print(f"Analysis (first 100 chars): {data['data']['analysis'][:100]}...")
            else:
                print("No analysis found in response")
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Murder Agent API...")

    # Test ping
    ping_success = test_ping()

    # Test question
    question_success = test_question()

    # Test sample case
    sample_success = test_sample_case()

    # Print summary
    print("\nTest Summary:")
    print(f"Ping: {'Success' if ping_success else 'Failed'}")
    print(f"Question: {'Success' if question_success else 'Failed'}")
    print(f"Sample Case: {'Success' if sample_success else 'Failed'}")

    # Exit with appropriate code
    if ping_success and question_success and sample_success:
        print("\nAll tests passed!")
        sys.exit(0)
    else:
        print("\nSome tests failed!")
        sys.exit(1)
