#!/usr/bin/env python3
"""
Test script to verify the Murder Agent fixes for:
1. Analysis result display without external trigger
2. PDF generation functionality
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:5001"  # Murder Agent backend
UNIFIED_URL = "http://localhost:5000"  # Unified server

def test_analysis_completion_flow():
    """Test that analysis results are properly displayed without external triggers."""
    print("=" * 60)
    print("Testing Analysis Completion Flow")
    print("=" * 60)
    
    # Start a new conversation
    print("1. Starting new conversation...")
    response = requests.post(f"{BACKEND_URL}/api/augment/murder", json={
        "question": "",
        "force_new_session": True
    })
    
    if response.status_code != 200:
        print(f"❌ Failed to start conversation: {response.status_code}")
        return False
    
    data = response.json()
    session_id = data.get("session_id")
    print(f"✅ Started conversation with session ID: {session_id}")
    
    # Simulate Q&A session with minimal data
    questions_answers = [
        ("John Doe", "victim_name"),
        ("2024-01-15", "crime_date"),
        ("123 Main St", "location"),
        ("Gunshot wound", "cause_of_death"),
        ("Jane Smith", "suspect_name"),
        ("Ex-wife", "suspect_relationship"),
        ("Financial dispute", "motive"),
        ("Gun found at scene", "evidence"),
        ("No additional notes", "additional_notes")
    ]
    
    print("2. Simulating Q&A session...")
    for answer, field in questions_answers:
        response = requests.post(f"{BACKEND_URL}/api/augment/murder", json={
            "question": answer,
            "session_id": session_id
        })
        
        if response.status_code != 200:
            print(f"❌ Failed to submit answer '{answer}': {response.status_code}")
            return False
        
        data = response.json()
        print(f"   Submitted: {answer} -> {data.get('data', {}).get('current_step', 'unknown')}")
        
        # Check if we've reached analysis
        if data.get('data', {}).get('current_step') == 'analysis':
            print("✅ Reached analysis step")
            break
    
    # Wait for analysis to complete and check status
    print("3. Checking analysis completion...")
    max_attempts = 10
    for attempt in range(max_attempts):
        # Use the new analysis status endpoint
        response = requests.get(f"{BACKEND_URL}/api/augment/murder/analysis-status", params={
            "session_id": session_id
        })
        
        if response.status_code == 200:
            data = response.json()
            status = data.get("status")
            print(f"   Attempt {attempt + 1}: Status = {status}")
            
            if status == "completed":
                analysis = data.get("data", {}).get("analysis", "")
                if analysis and "Analysis is currently in progress" not in analysis:
                    print("✅ Analysis completed successfully!")
                    print(f"   Analysis preview: {analysis[:100]}...")
                    return True
        
        time.sleep(2)
    
    print("❌ Analysis did not complete within expected time")
    return False

def test_pdf_generation():
    """Test PDF generation functionality."""
    print("\n" + "=" * 60)
    print("Testing PDF Generation")
    print("=" * 60)
    
    # Sample data for PDF generation
    sample_data = {
        "title": "Test Murder Investigation Report",
        "agent_type": "murder",
        "case_id": f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "crime_date": "2024-01-15",
        "location": "123 Main St",
        "victim_name": "John Doe",
        "cause_of_death": "Gunshot wound",
        "suspect_name": "Jane Smith",
        "suspect_relationship": "Ex-wife",
        "motive": "Financial dispute",
        "evidence": "Gun found at scene",
        "additional_notes": "Test case for PDF generation",
        "conversation_pairs": [
            {
                "question": "What is the victim's name?",
                "answer": "John Doe",
                "timestamp": datetime.now().isoformat()
            },
            {
                "question": "When did the crime occur?",
                "answer": "2024-01-15",
                "timestamp": datetime.now().isoformat()
            }
        ]
    }
    
    print("1. Testing PDF generation...")
    try:
        response = requests.post(f"{UNIFIED_URL}/api/generate-pdf", json=sample_data)
        
        if response.status_code == 200:
            # Check if we got a PDF
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                print("✅ PDF generated successfully!")
                print(f"   Content-Type: {content_type}")
                print(f"   Content-Length: {len(response.content)} bytes")
                
                # Save the PDF for verification
                pdf_filename = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                with open(pdf_filename, 'wb') as f:
                    f.write(response.content)
                print(f"   Saved as: {pdf_filename}")
                return True
            else:
                print(f"❌ Expected PDF but got: {content_type}")
                print(f"   Response: {response.text[:200]}...")
                return False
        else:
            print(f"❌ PDF generation failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to unified server. Make sure it's running on port 5000.")
        return False
    except Exception as e:
        print(f"❌ Error during PDF generation test: {str(e)}")
        return False

def main():
    """Run all tests."""
    print("Murder Agent Fix Verification Tests")
    print("=" * 60)
    
    # Test 1: Analysis completion flow
    analysis_test_passed = False
    try:
        analysis_test_passed = test_analysis_completion_flow()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to murder agent backend. Make sure it's running on port 5001.")
    except Exception as e:
        print(f"❌ Error during analysis test: {str(e)}")
    
    # Test 2: PDF generation
    pdf_test_passed = test_pdf_generation()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Analysis Completion Test: {'✅ PASSED' if analysis_test_passed else '❌ FAILED'}")
    print(f"PDF Generation Test:      {'✅ PASSED' if pdf_test_passed else '❌ FAILED'}")
    
    if analysis_test_passed and pdf_test_passed:
        print("\n🎉 All tests passed! Both issues appear to be fixed.")
    else:
        print("\n⚠️  Some tests failed. Please check the output above for details.")
    
    return analysis_test_passed and pdf_test_passed

if __name__ == "__main__":
    main()
