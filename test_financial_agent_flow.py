#!/usr/bin/env python3
"""
Test script to verify Financial Agent conversation flow works correctly.
This script tests the 14-question conversation flow and session persistence.
"""

import sys
import os

# Add the FinancialAgent directory to the path
financial_agent_path = os.path.join(os.path.dirname(__file__), 'Agents', 'Agent', 'FinancialAgent')
if financial_agent_path not in sys.path:
    sys.path.insert(0, financial_agent_path)

def test_financial_agent_conversation_flow():
    """Test the complete 14-question conversation flow."""
    print("🧪 Testing Financial Agent Conversation Flow")
    print("=" * 50)
    
    try:
        from financial_fraud_agent_main import FinancialFraudAgent
        
        # Initialize the agent
        api_key = "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"
        agent = FinancialFraudAgent(api_key)
        print("✅ Financial Agent initialized successfully")
        
        # Test responses for all 14 questions
        test_responses = [
            "CASE-001",                                    # case_id
            "2023-12-01",                                 # date_of_incident
            "09:30 AM",                                   # time_of_discovery
            "First National Bank",                        # financial_institution
            "John Smith",                                 # victim_name
            "Checking Account",                           # account_type
            "****1234",                                   # account_number
            "Credit Card Fraud",                          # fraud_type
            "$5,000",                                     # amount_involved
            "Skimming device at ATM",                     # method_used
            "Multiple transactions in different states",  # suspicious_activity
            "Transaction logs, CCTV footage",            # evidence_collected
            "Unknown suspects",                           # suspects
            "Victim noticed unauthorized charges"         # additional_notes
        ]
        
        # Start with a new session
        session_id, response, is_collecting, current_step, error = agent.process_message(
            "", None, force_new_session=True
        )
        
        if error:
            print(f"❌ Error initializing session: {error}")
            return False
            
        print(f"✅ Session initialized: {session_id}")
        print(f"📝 Initial question: {response}")
        print(f"🔄 Current step: {current_step}")
        print()
        
        # Process each test response
        for i, test_input in enumerate(test_responses, 1):
            try:
                session_id, response, is_collecting, current_step, error = agent.process_message(
                    test_input, session_id
                )
                
                if error:
                    print(f"❌ Error at step {i}: {error}")
                    return False
                    
                print(f"✅ Step {i}: {current_step}")
                print(f"   Input: '{test_input}'")
                print(f"   Response: {response[:100]}{'...' if len(response) > 100 else ''}")
                print(f"   Is Collecting: {is_collecting}")
                print()
                
                # Check if we've reached analysis
                if current_step == "analysis":
                    print(f"🎯 Reached analysis step after {i} inputs")
                    if not is_collecting:
                        print("✅ Analysis mode activated correctly")
                        print(f"📊 Full Analysis Preview: {response[:200]}...")
                        return True
                    else:
                        print("❌ Should not be collecting info during analysis")
                        return False
                        
            except Exception as e:
                print(f"❌ Failed at step {i} with input '{test_input}': {e}")
                return False
        
        print("❌ Did not reach analysis step after all inputs")
        return False
        
    except Exception as e:
        print(f"❌ Error testing Financial Agent conversation: {str(e)}")
        return False

def test_session_persistence():
    """Test that session data persists correctly."""
    print("\n🧪 Testing Session Persistence")
    print("=" * 50)
    
    try:
        from financial_fraud_agent_main import FinancialFraudAgent
        
        # Initialize the agent
        api_key = "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"
        agent = FinancialFraudAgent(api_key)
        
        # Start a new session
        session_id, response, is_collecting, current_step, error = agent.process_message(
            "", None, force_new_session=True
        )
        
        print(f"✅ Session created: {session_id}")
        
        # Answer first question
        session_id, response, is_collecting, current_step, error = agent.process_message(
            "TEST-CASE-001", session_id
        )
        
        print(f"✅ First question answered, current step: {current_step}")
        
        # Check if session data is stored
        if session_id in agent.conversation_states:
            collected_data = agent.conversation_states[session_id]["collected_data"]
            if "case_id" in collected_data and collected_data["case_id"] == "TEST-CASE-001":
                print("✅ Session data persisted correctly")
                return True
            else:
                print(f"❌ Session data not stored correctly: {collected_data}")
                return False
        else:
            print("❌ Session not found in conversation states")
            return False
            
    except Exception as e:
        print(f"❌ Error testing session persistence: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Financial Agent Tests")
    print("=" * 60)
    
    # Test conversation flow
    flow_test_passed = test_financial_agent_conversation_flow()
    
    # Test session persistence
    persistence_test_passed = test_session_persistence()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"Conversation Flow Test: {'✅ PASSED' if flow_test_passed else '❌ FAILED'}")
    print(f"Session Persistence Test: {'✅ PASSED' if persistence_test_passed else '❌ FAILED'}")
    
    if flow_test_passed and persistence_test_passed:
        print("\n🎉 All tests passed! Financial Agent is working correctly.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        sys.exit(1)
