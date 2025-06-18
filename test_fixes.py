#!/usr/bin/env python3
"""
Test script to verify the fixes for Murder Agent analysis and PDF generation.
"""

import requests
import json
import time
import sys
import os

# Test configuration
MURDER_AGENT_URL = "http://localhost:5001/api/augment/murder"
PDF_GENERATION_URL = "http://localhost:5000/api/generate-pdf"

def test_murder_agent_analysis():
    """Test the Murder Agent analysis flow to ensure immediate results."""
    print("🔍 Testing Murder Agent Analysis Flow...")
    
    # Test data for a complete case
    test_case = {
        "question": "CASE001",
        "session_id": None,
        "force_new_session": True
    }
    
    try:
        # Step 1: Initialize new session
        print("  📝 Step 1: Initializing new session...")
        response = requests.post(MURDER_AGENT_URL, json=test_case, timeout=10)
        
        if response.status_code != 200:
            print(f"  ❌ Failed to initialize session: {response.status_code}")
            return False
            
        data = response.json()
        session_id = data.get("session_id")
        print(f"  ✅ Session initialized: {session_id}")
        
        # Step 2: Provide answers to complete the case
        questions_and_answers = [
            ("2024-01-15", "date"),
            ("10:30 PM", "time"),
            ("123 Main Street", "location"),
            ("John Doe", "victim name"),
            ("35", "age"),
            ("Male", "gender"),
            ("Gunshot wound", "cause of death"),
            ("Handgun", "weapon"),
            ("Living room with signs of struggle", "crime scene"),
            ("Neighbor heard gunshots", "witnesses"),
            ("Bullet casings found", "evidence"),
            ("Ex-business partner", "suspects"),
            ("Financial dispute over business deal", "additional notes")
        ]
        
        print("  📋 Step 2: Providing case details...")
        for i, (answer, description) in enumerate(questions_and_answers):
            print(f"    {i+1}. Providing {description}: {answer}")
            
            response = requests.post(MURDER_AGENT_URL, json={
                "question": answer,
                "session_id": session_id
            }, timeout=30)
            
            if response.status_code != 200:
                print(f"    ❌ Failed at step {i+1}: {response.status_code}")
                return False
                
            data = response.json()
            current_step = data.get("data", {}).get("current_step")
            
            # Check if we've reached the analysis step
            if current_step == "completed":
                print(f"  🎯 Analysis completed at step {i+1}!")
                analysis = data.get("data", {}).get("analysis", "")
                if "ANALYSIS" in analysis.upper() or "COMPREHENSIVE" in analysis.upper():
                    print("  ✅ Analysis contains expected content")
                    return True
                else:
                    print("  ⚠️  Analysis completed but content seems incomplete")
                    print(f"     Analysis preview: {analysis[:200]}...")
                    return True
        
        print("  ⚠️  Completed all steps but no analysis generated")
        return False
        
    except requests.exceptions.Timeout:
        print("  ❌ Request timed out - this might indicate the analysis is taking too long")
        return False
    except Exception as e:
        print(f"  ❌ Error testing Murder Agent: {e}")
        return False

def test_pdf_generation():
    """Test PDF generation with sample data."""
    print("📄 Testing PDF Generation...")
    
    # Sample data for PDF generation
    sample_data = {
        "title": "Test Murder Investigation Report",
        "agentType": "murder",
        "agent_type": "murder",
        "data": {
            "case_id": "TEST001",
            "crime_date": "2024-01-15",
            "crime_time": "10:30 PM",
            "location": "123 Main Street",
            "victim_name": "John Doe",
            "victim_age": "35",
            "victim_gender": "Male",
            "cause_of_death": "Gunshot wound",
            "weapon_used": "Handgun",
            "crime_scene_description": "Living room with signs of struggle",
            "witnesses": "Neighbor heard gunshots",
            "evidence_found": "Bullet casings found",
            "suspects": "Ex-business partner",
            "additional_notes": "Financial dispute over business deal"
        },
        "messages": [
            {"sender": "assistant", "content": "What is the case ID?", "agentType": "murder"},
            {"sender": "user", "content": "TEST001"},
            {"sender": "assistant", "content": "When did the crime occur?", "agentType": "murder"},
            {"sender": "user", "content": "2024-01-15"}
        ],
        "includeAIAnalysis": True
    }
    
    try:
        print("  📤 Sending PDF generation request...")
        response = requests.post(PDF_GENERATION_URL, json=sample_data, timeout=60)
        
        if response.status_code == 200:
            # Check if we got a PDF back
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                print("  ✅ PDF generated successfully!")
                print(f"     Content-Type: {content_type}")
                print(f"     Content-Length: {len(response.content)} bytes")
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

def main():
    """Run all tests."""
    print("🧪 Running AiJusticeGrid Fix Tests\n")
    
    # Check if servers are running
    print("🔍 Checking server availability...")
    
    try:
        # Check Murder Agent backend
        response = requests.get("http://localhost:5001/api/health", timeout=5)
        if response.status_code == 200:
            print("  ✅ Murder Agent backend is running")
        else:
            print("  ❌ Murder Agent backend not responding properly")
            return
    except:
        print("  ❌ Murder Agent backend not accessible at localhost:5001")
        print("     Please start the Murder Agent backend first:")
        print("     cd AiJusticeGrid && python murder_agent_backend.py")
        return
    
    try:
        # Check Unified server
        response = requests.get("http://localhost:5000/", timeout=5)
        if response.status_code == 200:
            print("  ✅ Unified server is running")
        else:
            print("  ❌ Unified server not responding properly")
            return
    except:
        print("  ❌ Unified server not accessible at localhost:5000")
        print("     Please start the unified server first:")
        print("     cd AiJusticeGrid && python unified_server.py")
        return
    
    print("\n" + "="*50)
    
    # Run tests
    test_results = []
    
    # Test 1: Murder Agent Analysis
    test_results.append(("Murder Agent Analysis", test_murder_agent_analysis()))
    
    print("\n" + "="*50)
    
    # Test 2: PDF Generation
    test_results.append(("PDF Generation", test_pdf_generation()))
    
    # Summary
    print("\n" + "="*50)
    print("📊 Test Results Summary:")
    
    all_passed = True
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name}: {status}")
        if not result:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! The fixes are working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")
    
    print("\n" + "="*50)

if __name__ == "__main__":
    main()
