#!/usr/bin/env python3
"""
Test the frontend PDF generation API to verify the fix.
"""

import requests
import json

def test_frontend_pdf_api():
    """Test the Next.js PDF generation API endpoint."""
    
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
            },
            {
                "sender": "assistant",
                "content": "Murder Agent Live Data Live Data Analysis\n\nWhere did the crime take place?",
                "timestamp": "2025-01-16T10:02:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "789 Elm Street, Apartment 3C",
                "timestamp": "2025-01-16T10:02:30Z"
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
        print("🧪 Testing Next.js PDF generation API...")
        print(f"📡 Sending request to: http://localhost:3000/api/generate-pdf")
        
        response = requests.post(
            'http://localhost:3000/api/generate-pdf',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📋 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Frontend PDF generation successful!")
            print(f"📄 PDF size: {len(response.content)} bytes")
            
            # Save the PDF for inspection
            with open('test_frontend_fix_output.pdf', 'wb') as f:
                f.write(response.content)
            print("💾 PDF saved as: test_frontend_fix_output.pdf")
            
            return True
            
        else:
            print(f"❌ Frontend PDF generation failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"🔍 Error details: {error_data}")
            except:
                print(f"🔍 Error response: {response.text}")
            return False
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the Next.js server running on port 3000?")
        return False
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Frontend PDF Generation Fix")
    print("This test verifies that the frontend can successfully generate PDFs")
    print("after fixing the backend URL configuration.\n")
    
    success = test_frontend_pdf_api()
    
    if success:
        print("\n🎉 Frontend PDF generation is working!")
        print("✅ The DownloadReportButton should now work correctly")
        print("✅ Backend URL configuration has been fixed")
    else:
        print("\n❌ Frontend PDF generation still has issues")
        print("Please check the Next.js server logs for more details")
