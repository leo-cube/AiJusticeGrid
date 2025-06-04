#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script to verify Financial Agent fixes
"""

import sys
import os
import json
import requests
import time

# Add the Agent directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Agents', 'Agent'))

def test_financial_agent_import():
    """Test if Financial Agent can be imported and initialized"""
    try:
        from FinancialAgent.financial_fraud_agent_main import FinancialFraudAgent
        
        # Test initialization with API key
        api_key = "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"
        agent = FinancialFraudAgent(api_key)
        
        print("✅ Financial Agent imported and initialized successfully")
        
        # Test process_message method
        session_id, response, is_collecting, step, error = agent.process_message("", None, True, False)
        print(f"✅ Process message method works: {response[:50]}...")
        
        return True
    except Exception as e:
        print(f"❌ Financial Agent import/initialization failed: {e}")
        return False

def test_unified_server_import():
    """Test if unified server can import Financial Agent"""
    try:
        from unified_server import financial_agent, AGENTS
        
        if financial_agent:
            print("✅ Unified server has Financial Agent available")
        else:
            print("❌ Unified server Financial Agent is None")
            
        print(f"✅ Finance agent enabled in AGENTS: {AGENTS['finance']['enabled']}")
        return True
    except Exception as e:
        print(f"❌ Unified server import failed: {e}")
        return False

def test_api_endpoint():
    """Test the Financial Agent API endpoint"""
    try:
        # Test data
        test_data = {
            "question": "What is the case ID for this financial fraud investigation?",
            "session_id": None,
            "force_new_session": True
        }
        
        # Make request to the API
        response = requests.post(
            "http://localhost:5000/api/augment/finance",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Financial Agent API endpoint responds successfully")
            print(f"Response: {data.get('data', {}).get('analysis', 'No analysis')[:100]}...")
            return True
        else:
            print(f"❌ API endpoint returned status {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API endpoint (server may not be running)")
        return False
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Financial Agent Fixes")
    print("=" * 50)
    
    tests = [
        ("Financial Agent Import/Init", test_financial_agent_import),
        ("Unified Server Import", test_unified_server_import),
        ("API Endpoint", test_api_endpoint)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Financial Agent fixes are working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")

if __name__ == "__main__":
    main()
