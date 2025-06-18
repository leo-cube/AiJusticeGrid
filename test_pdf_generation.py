#!/usr/bin/env python3
"""
Test script specifically for PDF generation to debug the empty PDF issue.
"""

import requests
import json
import sys
import os

# Test configuration
PDF_GENERATION_URL = "http://localhost:5000/api/generate-pdf"

def test_pdf_with_sample_data():
    """Test PDF generation with comprehensive sample data."""
    print("🧪 Testing PDF Generation with Sample Murder Case Data...")

    # Comprehensive sample data that matches what the frontend should send
    # This simulates the exact structure from the frontend after data extraction
    sample_data = {
        "title": "Murder Investigation Report - Test Case",
        "agentType": "murder",
        "agent_type": "murder",
        "analysisType": "murder",
        "includeAIAnalysis": True,
        "timestamp": "2024-01-15T22:30:00.000Z",
        "data": {
            "case_id": "MURDER-TEST-001",
            "crime_date": "2024-01-15",
            "date": "2024-01-15",
            "crime_time": "10:30 PM",
            "time": "10:30 PM",
            "location": "123 Main Street, Downtown",
            "victim_name": "John Doe",
            "name": "John Doe",
            "victim_age": "35",
            "age": "35",
            "victim_gender": "Male",
            "gender": "Male",
            "cause_of_death": "Gunshot wound to the chest",
            "weapon_used": "9mm handgun",
            "weapon": "9mm handgun",
            "crime_scene_description": "Living room with signs of struggle, overturned furniture",
            "crime_scene": "Living room with signs of struggle, overturned furniture",
            "witnesses": "Neighbor heard gunshots around 10:30 PM",
            "evidence_found": "Bullet casings, fingerprints on door handle, blood spatter",
            "evidence": "Bullet casings, fingerprints on door handle, blood spatter",
            "suspects": "Ex-business partner with financial motive",
            "additional_notes": "Victim had received threatening messages prior to incident",
            "notes": "Victim had received threatening messages prior to incident"
        },
        "conversation_pairs": [
            {
                "question": "What is the case ID for this investigation?",
                "answer": "MURDER-TEST-001"
            },
            {
                "question": "When did the crime occur? Please provide the date.",
                "answer": "2024-01-15"
            },
            {
                "question": "What time did the incident happen?",
                "answer": "10:30 PM"
            },
            {
                "question": "Where did the crime take place?",
                "answer": "123 Main Street, Downtown"
            },
            {
                "question": "What is the victim's name?",
                "answer": "John Doe"
            },
            {
                "question": "How old was the victim?",
                "answer": "35"
            },
            {
                "question": "What was the victim's gender?",
                "answer": "Male"
            },
            {
                "question": "What was the cause of death?",
                "answer": "Gunshot wound to the chest"
            },
            {
                "question": "What weapon was used in the crime?",
                "answer": "9mm handgun"
            },
            {
                "question": "Can you describe the crime scene?",
                "answer": "Living room with signs of struggle, overturned furniture"
            },
            {
                "question": "Were there any witnesses to the crime?",
                "answer": "Neighbor heard gunshots around 10:30 PM"
            },
            {
                "question": "What evidence was found at the scene?",
                "answer": "Bullet casings, fingerprints on door handle, blood spatter"
            },
            {
                "question": "Do you have any suspects?",
                "answer": "Ex-business partner with financial motive"
            },
            {
                "question": "Any additional notes about the case?",
                "answer": "Victim had received threatening messages prior to incident"
            }
        ],
        "messages": [
            {"sender": "assistant", "content": "What is the case ID for this investigation?", "agentType": "murder"},
            {"sender": "user", "content": "MURDER-TEST-001"},
            {"sender": "assistant", "content": "When did the crime occur? Please provide the date.", "agentType": "murder"},
            {"sender": "user", "content": "2024-01-15"},
            {"sender": "assistant", "content": "What time did the incident happen?", "agentType": "murder"},
            {"sender": "user", "content": "10:30 PM"},
            {"sender": "assistant", "content": "Where did the crime take place?", "agentType": "murder"},
            {"sender": "user", "content": "123 Main Street, Downtown"}
        ],
        "includeAIAnalysis": True,
        "requestId": "test-request-001",
        "sessionId": "test-session-001"
    }
    
    print("📤 Sending comprehensive PDF generation request...")
    print(f"   Data keys: {list(sample_data.keys())}")
    print(f"   Case data keys: {list(sample_data['data'].keys())}")
    print(f"   Conversation pairs: {len(sample_data['conversation_pairs'])}")
    
    try:
        response = requests.post(PDF_GENERATION_URL, json=sample_data, timeout=60)
        
        if response.status_code == 200:
            # Check if we got a PDF back
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                print("  ✅ PDF generated successfully!")
                print(f"     Content-Type: {content_type}")
                print(f"     Content-Length: {len(response.content)} bytes")
                
                # Save the PDF for inspection
                with open("test_murder_report.pdf", "wb") as f:
                    f.write(response.content)
                print("     📄 PDF saved as 'test_murder_report.pdf' for inspection")
                
                return True
            else:
                print(f"  ⚠️  Response received but not a PDF: {content_type}")
                print(f"     Response preview: {response.text[:200]}...")
                return False
        else:
            print(f"  ❌ PDF generation failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"     Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"     Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print("  ❌ PDF generation timed out")
        return False
    except Exception as e:
        print(f"  ❌ Error testing PDF generation: {e}")
        return False

def test_pdf_with_minimal_data():
    """Test PDF generation with minimal data to see if it works."""
    print("\n🧪 Testing PDF Generation with Minimal Data...")
    
    minimal_data = {
        "title": "Minimal Test Report",
        "agentType": "murder",
        "data": {
            "case_id": "MIN-001",
            "date": "2024-01-01",
            "location": "Test Location"
        }
    }
    
    print("📤 Sending minimal PDF generation request...")
    
    try:
        response = requests.post(PDF_GENERATION_URL, json=minimal_data, timeout=30)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                print("  ✅ Minimal PDF generated successfully!")
                print(f"     Content-Length: {len(response.content)} bytes")
                
                # Save the minimal PDF
                with open("test_minimal_report.pdf", "wb") as f:
                    f.write(response.content)
                print("     📄 PDF saved as 'test_minimal_report.pdf'")
                
                return True
            else:
                print(f"  ⚠️  Not a PDF: {content_type}")
                return False
        else:
            print(f"  ❌ Failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_pdf_with_frontend_format():
    """Test PDF generation with the exact format sent by the frontend."""
    print("\n🧪 Testing PDF Generation with Frontend Message Format...")

    # This simulates exactly what the frontend sends
    frontend_data = {
        "title": "Murder Investigation Report",
        "analysisType": "murder",
        "agentType": "murder",
        "messages": [
            {
                "sender": "assistant",
                "content": "What is the case ID for this investigation?",
                "timestamp": "2024-01-15T22:00:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "MURDER-TEST-001",
                "timestamp": "2024-01-15T22:00:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "When did the crime occur? Please provide the date.",
                "timestamp": "2024-01-15T22:01:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "2024-01-15",
                "timestamp": "2024-01-15T22:01:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "What time did the incident happen?",
                "timestamp": "2024-01-15T22:02:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "10:30 PM",
                "timestamp": "2024-01-15T22:02:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "Where did the crime take place?",
                "timestamp": "2024-01-15T22:03:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "123 Main Street, Downtown",
                "timestamp": "2024-01-15T22:03:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "What is the victim's name?",
                "timestamp": "2024-01-15T22:04:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "John Doe",
                "timestamp": "2024-01-15T22:04:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "How old was the victim?",
                "timestamp": "2024-01-15T22:05:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "35",
                "timestamp": "2024-01-15T22:05:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "What was the victim's gender?",
                "timestamp": "2024-01-15T22:06:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Male",
                "timestamp": "2024-01-15T22:06:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "What was the cause of death?",
                "timestamp": "2024-01-15T22:07:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Gunshot wound to the chest",
                "timestamp": "2024-01-15T22:07:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "What weapon was used in the crime?",
                "timestamp": "2024-01-15T22:08:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "9mm handgun",
                "timestamp": "2024-01-15T22:08:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "Can you describe the crime scene?",
                "timestamp": "2024-01-15T22:09:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Living room with signs of struggle, overturned furniture",
                "timestamp": "2024-01-15T22:09:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "Were there any witnesses to the crime?",
                "timestamp": "2024-01-15T22:10:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Neighbor heard gunshots around 10:30 PM",
                "timestamp": "2024-01-15T22:10:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "What evidence was found at the scene?",
                "timestamp": "2024-01-15T22:11:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Bullet casings, fingerprints on door handle, blood spatter",
                "timestamp": "2024-01-15T22:11:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "Do you have any suspects?",
                "timestamp": "2024-01-15T22:12:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Ex-business partner with financial motive",
                "timestamp": "2024-01-15T22:12:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "Any additional notes about the case?",
                "timestamp": "2024-01-15T22:13:00.000Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Victim had received threatening messages prior to incident",
                "timestamp": "2024-01-15T22:13:30.000Z"
            },
            {
                "sender": "assistant",
                "content": "## COMPREHENSIVE ANALYSIS\n\nBased on the investigation details provided, this appears to be a premeditated homicide case...",
                "timestamp": "2024-01-15T22:14:00.000Z",
                "agentType": "murder"
            }
        ],
        "includeAIAnalysis": True,
        "userMetadata": {
            "sessionId": "test-session-001",
            "userId": "test-user",
            "requestId": "test-request-001"
        },
        "timestamp": "2024-01-15T22:14:00.000Z"
    }

    print("📤 Sending frontend-format PDF generation request...")
    print(f"   Message count: {len(frontend_data['messages'])}")
    print(f"   Agent type: {frontend_data['agentType']}")

    try:
        response = requests.post(PDF_GENERATION_URL, json=frontend_data, timeout=60)

        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                print("  ✅ Frontend-format PDF generated successfully!")
                print(f"     Content-Length: {len(response.content)} bytes")

                # Save the PDF for inspection
                with open("test_frontend_format_report.pdf", "wb") as f:
                    f.write(response.content)
                print("     📄 PDF saved as 'test_frontend_format_report.pdf'")

                return True
            else:
                print(f"  ⚠️  Not a PDF: {content_type}")
                print(f"     Response: {response.text[:200]}...")
                return False
        else:
            print(f"  ❌ Failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"     Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"     Response: {response.text[:200]}...")
            return False

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Run PDF generation tests."""
    print("🔧 PDF Generation Debug Tests")
    print("="*50)

    # Check if server is running
    try:
        response = requests.get("http://localhost:5000/", timeout=5)
        if response.status_code == 200:
            print("✅ Unified server is running")
        else:
            print("❌ Unified server not responding properly")
            return
    except:
        print("❌ Unified server not accessible at localhost:5000")
        print("   Please start the server first: python unified_server.py")
        return

    print("\n" + "="*50)

    # Test 1: Comprehensive data (direct backend format)
    test1_result = test_pdf_with_sample_data()

    # Test 2: Frontend message format (simulates real usage)
    test2_result = test_pdf_with_frontend_format()

    # Test 3: Minimal data
    test3_result = test_pdf_with_minimal_data()

    # Summary
    print("\n" + "="*50)
    print("📊 Test Results:")
    print(f"  Direct Backend Format Test: {'✅ PASSED' if test1_result else '❌ FAILED'}")
    print(f"  Frontend Message Format Test: {'✅ PASSED' if test2_result else '❌ FAILED'}")
    print(f"  Minimal Data Test: {'✅ PASSED' if test3_result else '❌ FAILED'}")

    if test1_result or test2_result or test3_result:
        print("\n💡 Check the generated PDF files to see if they contain the expected content:")
        if test1_result:
            print("   - test_murder_report.pdf (direct backend format)")
        if test2_result:
            print("   - test_frontend_format_report.pdf (frontend message format)")
        if test3_result:
            print("   - test_minimal_report.pdf (minimal data)")
        print("   If PDFs are generated but empty, the issue is in the data processing logic.")
    else:
        print("\n⚠️  All tests failed. Check the server logs for detailed error information.")

    print("\n" + "="*50)

if __name__ == "__main__":
    main()
