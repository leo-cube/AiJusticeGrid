#!/usr/bin/env python3
"""
Test script to verify the Financial Agent conversation flow fixes.
"""

import sys
import os

# Add the FinancialAgent directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Agents', 'Agent', 'FinancialAgent'))

try:
    from financial_fraud_agent_main import FinancialFraudAgent, conversation_states
    print("✅ Successfully imported FinancialFraudAgent")
except ImportError as e:
    print(f"❌ Failed to import FinancialFraudAgent: {e}")
    sys.exit(1)

def test_conversation_flow():
    """Test the conversation flow to ensure it progresses correctly."""
    print("\n🧪 Testing Financial Agent Conversation Flow...")
    
    # Use a dummy API key for testing
    api_key = "nvapi-test-key-for-conversation-flow-testing"
    
    try:
        # Initialize the agent
        agent = FinancialFraudAgent(api_key)
        print("✅ Agent initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        return False
    
    # Test conversation flow
    session_id = None
    test_responses = [
        "FR001",  # Case ID
        "2024-01-15",  # Date of incident
        "09:30 AM",  # Time of discovery
        "First National Bank",  # Financial institution
        "John Smith",  # Victim name
        "Checking Account",  # Account type
        "1234",  # Account number (last 4 digits)
        "Credit Card Fraud",  # Fraud type
        "$5,000",  # Amount involved
        "Skimming device",  # Method used
        "Unusual transactions",  # Suspicious activity
        "Transaction logs, CCTV footage",  # Evidence collected
        "Unknown suspects",  # Suspects
        "Case reported by victim"  # Additional notes
    ]
    
    print(f"\n📝 Testing conversation with {len(test_responses)} responses...")
    
    # Start the conversation
    try:
        session_id, response, is_collecting, current_step, error = agent.process_message(
            "", session_id, force_new_session=True
        )
        print(f"✅ Initial greeting: {current_step}")
        print(f"📄 Response: {response[:100]}...")
        
        if not is_collecting:
            print("❌ Agent should be collecting info at start")
            return False
            
    except Exception as e:
        print(f"❌ Failed to get initial greeting: {e}")
        return False
    
    # Process each test response
    for i, test_input in enumerate(test_responses, 1):
        try:
            session_id, response, is_collecting, current_step, error = agent.process_message(
                test_input, session_id
            )
            
            if error:
                print(f"❌ Error at step {i}: {error}")
                return False
                
            print(f"✅ Step {i}: {current_step} - Input: '{test_input}'")
            
            # Check if we've reached analysis
            if current_step == "analysis":
                print(f"🎯 Reached analysis step after {i} inputs")
                if not is_collecting:
                    print("✅ Analysis mode activated correctly")
                    return True
                else:
                    print("❌ Should not be collecting info during analysis")
                    return False
                    
        except Exception as e:
            print(f"❌ Failed at step {i} with input '{test_input}': {e}")
            return False
    
    print("❌ Did not reach analysis step after all inputs")
    return False

def test_session_state():
    """Test that session state is properly maintained."""
    print("\n🧪 Testing Session State Management...")
    
    # Check that conversation states are properly initialized
    if 'conversation_states' not in globals():
        print("❌ conversation_states not available")
        return False
        
    print("✅ conversation_states available")
    
    # Test session creation
    api_key = "nvapi-test-key-for-session-testing"
    try:
        agent = FinancialFraudAgent(api_key)
        
        # Create a new session
        session_id, response, is_collecting, current_step, error = agent.process_message(
            "", None, force_new_session=True
        )
        
        if session_id and session_id in conversation_states:
            print(f"✅ Session {session_id[:8]}... created successfully")
            
            # Check session structure
            session_data = conversation_states[session_id]
            required_keys = ["current_step", "collected_data", "conversation_pairs", "last_updated", "status"]
            
            for key in required_keys:
                if key not in session_data:
                    print(f"❌ Missing key '{key}' in session data")
                    return False
                    
            print("✅ Session data structure is correct")
            return True
        else:
            print("❌ Session not created properly")
            return False
            
    except Exception as e:
        print(f"❌ Session test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting Financial Agent Fix Tests...")
    
    tests = [
        ("Conversation Flow", test_conversation_flow),
        ("Session State", test_session_state),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print('='*50)
        
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {e}")
    
    print(f"\n{'='*50}")
    print(f"TEST RESULTS: {passed}/{total} tests passed")
    print('='*50)
    
    if passed == total:
        print("🎉 All tests passed! Financial Agent fixes are working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
