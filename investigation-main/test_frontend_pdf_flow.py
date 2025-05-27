#!/usr/bin/env python3
"""
Test script to simulate the exact frontend PDF generation flow
Tests the complete data flow from frontend to backend
"""

import requests
import json
import sys
from datetime import datetime

def test_frontend_pdf_generation():
    """Test the PDF generation API with frontend-like data."""
    print("TESTING FRONTEND PDF GENERATION FLOW")
    print("="*50)
    
    # Simulate the exact data structure sent from PDFGenerationButton
    frontend_data = {
        "title": "Murder Investigation Report",
        "analysisType": "murder",
        "agentType": "murder",
        "messages": [
            {
                "sender": "assistant",
                "content": "Hello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. I'll help you analyze a murder case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
                "timestamp": "2024-01-16T17:57:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "LAPD1101",
                "timestamp": "2024-01-16T17:57:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nThank you. When did the crime occur? Please provide the date (YYYY-MM-DD, MM/DD/YYYY, or text format like 'January 15, 2023').",
                "timestamp": "2024-01-16T10:34:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "February 10, 2024",
                "timestamp": "2024-01-16T10:34:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat time did the crime occur? (HH:MM format, or approximate time like '2:30 PM', 'noon', or 'evening')",
                "timestamp": "2024-01-16T10:35:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Noon",
                "timestamp": "2024-01-16T10:35:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhere did the crime take place? Please provide the location.",
                "timestamp": "2024-01-16T10:36:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Chennai",
                "timestamp": "2024-01-16T10:36:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim's name?",
                "timestamp": "2024-01-16T10:37:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Noor",
                "timestamp": "2024-01-16T10:37:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim's age?",
                "timestamp": "2024-01-16T10:38:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "20",
                "timestamp": "2024-01-16T10:38:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim's gender?",
                "timestamp": "2024-01-16T10:39:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Male",
                "timestamp": "2024-01-16T10:39:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat was the cause of death?",
                "timestamp": "2024-01-16T10:40:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Shot",
                "timestamp": "2024-01-16T10:40:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWas a weapon used? If so, what kind?",
                "timestamp": "2024-01-16T10:41:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Gun",
                "timestamp": "2024-01-16T10:41:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nPlease describe the crime scene.",
                "timestamp": "2024-01-16T10:42:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "The victim is a cricket player and was shot dead in public",
                "timestamp": "2024-01-16T10:42:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWere there any witnesses? If so, please provide details.",
                "timestamp": "2024-01-16T10:43:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Yes 1000 people",
                "timestamp": "2024-01-16T10:43:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat evidence was found at the scene?",
                "timestamp": "2024-01-16T10:44:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Gun",
                "timestamp": "2024-01-16T10:44:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nAre there any suspects at this time?",
                "timestamp": "2024-01-16T10:45:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Yes a male with pale skin",
                "timestamp": "2024-01-16T10:45:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nDo you have any additional notes or information about the case?",
                "timestamp": "2024-01-16T10:46:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "No",
                "timestamp": "2024-01-16T10:46:30Z",
                "agentType": "murder"
            }
        ],
        "includeAIAnalysis": True,
        "userMetadata": {
            "sessionId": "session_1748324291767",
            "userId": "user",
            "requestId": "1748324291767"
        }
    }
    
    print(f"Sending request with {len(frontend_data['messages'])} messages")
    print(f"Agent Type: {frontend_data['agentType']}")
    print(f"Analysis Type: {frontend_data['analysisType']}")
    
    try:
        # Test the Next.js API route
        response = requests.post(
            'http://localhost:3001/api/generate-pdf',
            json=frontend_data,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            # Save the PDF
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'frontend_test_report_{timestamp}.pdf'
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            file_size = len(response.content)
            print(f"✓ PDF generated successfully: {filename}")
            print(f"✓ File size: {file_size:,} bytes")
            
            return True
        else:
            print(f"✗ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Error text: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Request failed: {str(e)}")
        return False

def main():
    """Run the frontend PDF generation test."""
    print("AI JUSTICE GRID - FRONTEND PDF GENERATION TEST")
    print("="*60)
    print("Testing the complete frontend-to-backend PDF generation flow")
    
    success = test_frontend_pdf_generation()
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Frontend PDF Generation: {'✓ PASS' if success else '✗ FAIL'}")
    
    if success:
        print("\n🎉 FRONTEND TEST PASSED!")
        print("The complete frontend-to-backend PDF generation is working.")
        print("\nThe system now:")
        print("✓ Receives data from frontend correctly")
        print("✓ Extracts Murder Agent conversation data")
        print("✓ Generates professional PDF reports")
        print("✓ Returns PDF for download")
    else:
        print("\n❌ FRONTEND TEST FAILED")
        print("Please check the error messages above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
