#!/usr/bin/env python3
"""
Test script to verify Murder Agent storage integration is working correctly
"""

import json
import requests
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
MURDER_AGENT_URL = f"{BASE_URL}/api/augment/murder"
STORAGE_URL = f"{BASE_URL}/api/murder-investigations"

def test_murder_agent_conversation_with_storage():
    """Test a complete Murder Agent conversation and verify storage"""
    print("🔍 Testing Murder Agent Conversation with Storage Integration")
    print("=" * 60)
    
    # Test case data
    test_case = {
        "case_id": "TEST_STORAGE_003",
        "responses": [
            "TEST_STORAGE_003",  # Case ID
            "2024-01-20",        # Date
            "15:45",             # Time
            "Downtown Office Building", # Location
            "Sarah Wilson",      # Victim name
            "28",                # Victim age
            "female",            # Victim gender
            "gunshot wound",     # Cause of death
            "pistol",            # Weapon
            "victim found in office cubicle", # Crime scene
            "security guard saw suspicious person", # Witnesses
            "bullet casing, security footage", # Evidence
            "unknown",           # Suspects
            "victim was working late" # Additional notes
        ]
    }
    
    session_id = None
    conversation_complete = False
    response_index = 0
    
    try:
        print("Starting Murder Agent conversation...")
        
        # Start the conversation
        while not conversation_complete and response_index < len(test_case["responses"]):
            # Prepare request data
            request_data = {
                "question": test_case["responses"][response_index]
            }
            
            if session_id:
                request_data["session_id"] = session_id
            
            print(f"\n📤 Sending: {test_case['responses'][response_index]}")
            
            # Send request to Murder Agent
            response = requests.post(MURDER_AGENT_URL, json=request_data)
            
            if response.status_code != 200:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return False
            
            response_data = response.json()
            
            if not response_data.get("success"):
                print(f"❌ Murder Agent returned error: {response_data.get('error')}")
                return False
            
            # Extract response details
            data = response_data.get("data", {})
            analysis = data.get("analysis", "")
            is_collecting_info = data.get("is_collecting_info", True)
            current_step = data.get("current_step", "")
            session_id = response_data.get("session_id")
            
            print(f"📥 Response: {analysis[:100]}...")
            print(f"   Collecting info: {is_collecting_info}")
            print(f"   Current step: {current_step}")
            print(f"   Session ID: {session_id}")
            
            # Check if conversation is complete (analysis step reached)
            if current_step == "analysis" and not is_collecting_info:
                conversation_complete = True
                print("✅ Analysis completed!")
                print(f"📊 Full Analysis:\n{analysis}")
                break
            
            response_index += 1
            time.sleep(0.5)  # Small delay between requests
        
        if not conversation_complete:
            print("❌ Conversation did not complete properly")
            return False
        
        # Wait a moment for storage to complete
        time.sleep(2)
        
        # Now test if the data was stored
        print("\n🔍 Checking if data was stored...")
        
        # Get all stored cases
        storage_response = requests.get(STORAGE_URL)
        
        if storage_response.status_code != 200:
            print(f"❌ Storage retrieval failed with status {storage_response.status_code}")
            return False
        
        storage_data = storage_response.json()
        
        if not storage_data.get("success"):
            print(f"❌ Storage retrieval error: {storage_data.get('error')}")
            return False
        
        cases = storage_data.get("data", {}).get("cases", {})
        metadata = storage_data.get("data", {}).get("metadata", {})
        
        print(f"📊 Storage metadata: {metadata}")
        print(f"📁 Total cases stored: {len(cases)}")
        
        # Check if our test case was stored
        if test_case["case_id"] in cases:
            case_data = cases[test_case["case_id"]]
            print(f"✅ Test case {test_case['case_id']} found in storage!")
            
            # Verify key data elements
            ai_analysis = case_data.get("ai_analysis", {})
            conversation_data = case_data.get("conversation_data", {})
            case_details = case_data.get("case_details", {})
            
            print(f"   AI Analysis generated: {ai_analysis.get('generated', False)}")
            print(f"   Conversation pairs: {len(conversation_data.get('conversation_pairs', []))}")
            print(f"   Victim name: {case_details.get('victim_information', {}).get('name')}")
            print(f"   Crime location: {case_details.get('crime_information', {}).get('location')}")
            
            # Verify AI analysis content
            if ai_analysis.get("generated") and ai_analysis.get("content"):
                analysis_content = ai_analysis.get("content", "")
                print(f"   AI Analysis length: {len(analysis_content)} characters")
                
                # Check for key analysis sections
                key_sections = [
                    "Comprehensive Analysis",
                    "Potential Motives",
                    "Recommended Investigative Approaches",
                    "Key Evidence",
                    "Possible Solutions"
                ]
                
                sections_found = 0
                for section in key_sections:
                    if section.lower() in analysis_content.lower():
                        sections_found += 1
                
                print(f"   Analysis sections found: {sections_found}/{len(key_sections)}")
                
                if sections_found >= 3:
                    print("✅ AI Analysis appears comprehensive!")
                else:
                    print("⚠️  AI Analysis may be incomplete")
            
            return True
        else:
            print(f"❌ Test case {test_case['case_id']} not found in storage")
            print(f"Available cases: {list(cases.keys())}")
            return False
    
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

def test_storage_api_endpoints():
    """Test the storage API endpoints"""
    print("\n🔗 Testing Storage API Endpoints")
    print("=" * 40)
    
    try:
        # Test get all cases
        response = requests.get(STORAGE_URL)
        if response.status_code == 200:
            print("✅ GET /api/murder-investigations - Working")
            data = response.json()
            cases = data.get("data", {}).get("cases", {})
            print(f"   Found {len(cases)} cases")
        else:
            print(f"❌ GET /api/murder-investigations - Failed ({response.status_code})")
            return False
        
        # Test get specific case (if any exist)
        if cases:
            case_id = list(cases.keys())[0]
            case_response = requests.get(f"{STORAGE_URL}/{case_id}")
            if case_response.status_code == 200:
                print(f"✅ GET /api/murder-investigations/{case_id} - Working")
            else:
                print(f"❌ GET /api/murder-investigations/{case_id} - Failed ({case_response.status_code})")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Murder Agent Storage Integration Test Suite")
    print("=" * 50)
    
    # Test backend connectivity first
    try:
        health_response = requests.get(f"{BASE_URL}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print("❌ Backend server health check failed")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend server: {e}")
        print("Please make sure the unified server is running on port 5000")
        return
    
    # Run tests
    tests_passed = 0
    total_tests = 2
    
    # Test 1: Storage API endpoints
    if test_storage_api_endpoints():
        tests_passed += 1
    
    # Test 2: Full conversation with storage
    if test_murder_agent_conversation_with_storage():
        tests_passed += 1
    
    # Results
    print("\n" + "=" * 50)
    print(f"🏁 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Murder Agent storage integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the output above for details.")

if __name__ == "__main__":
    main()
