#!/usr/bin/env python3
"""
Test the PDF generation endpoint directly to debug the issue.
"""

import requests
import json

def test_pdf_endpoint():
    """Test the PDF generation endpoint with sample data."""
    
    # Sample data that matches what the frontend sends
    test_data = {
        "title": "Murder Investigation Report",
        "analysisType": "murder",
        "agentType": "murder",
        "messages": [
            {
                "sender": "assistant",
                "content": "**[LIVE DATA ANALYSIS]**\n\nHello, I'm the Murder Agent. What is the Case ID for this investigation?",
                "timestamp": "2025-01-16T10:00:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "001",
                "timestamp": "2025-01-16T10:00:30Z"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent Live Data Live Data Analysis\n\nWhen did the crime occur?",
                "timestamp": "2025-01-16T10:01:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "January 15, 2025",
                "timestamp": "2025-01-16T10:01:30Z"
            }
        ],
        "includeAIAnalysis": True,
        "userMetadata": {
            "sessionId": "test_session",
            "userId": "test_user",
            "requestId": "test_request"
        }
    }
    
    try:
        print("🧪 Testing PDF generation endpoint...")
        print(f"📡 Sending request to: http://localhost:5000/api/generate-pdf")
        
        response = requests.post(
            'http://localhost:5000/api/generate-pdf',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📋 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ PDF generation successful!")
            print(f"📄 PDF size: {len(response.content)} bytes")
            
            # Save the PDF for inspection
            with open('test_endpoint_output.pdf', 'wb') as f:
                f.write(response.content)
            print("💾 PDF saved as: test_endpoint_output.pdf")
            
        else:
            print(f"❌ PDF generation failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"🔍 Error details: {error_data}")
            except:
                print(f"🔍 Error response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the backend server running on port 5000?")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_pdf_endpoint()
