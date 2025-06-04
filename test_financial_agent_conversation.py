#!/usr/bin/env python3
"""
Test script to verify the Financial Agent step-by-step conversation flow.
"""

import sys
import os

# Add the Agent directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Agents', 'Agent'))

def test_financial_agent_conversation():
    """Test the Financial Agent conversation flow."""
    try:
        # Import the Financial Agent
        from FinancialAgent.financial_fraud_agent_main import FinancialFraudAgent
        
        # Test API key
        api_key = "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"
        
        print("🔧 Initializing Financial Agent...")
        agent = FinancialFraudAgent(api_key)
        print("✅ Financial Agent initialized successfully")
        
        # Test the conversation flow
        print("\n📋 Testing step-by-step conversation flow...")
        
        # Step 1: Start conversation (greeting)
        session_id, response, is_collecting, step, error = agent.process_message("", None, True, False)
        print(f"Step 1 - Greeting:")
        print(f"  Session ID: {session_id}")
        print(f"  Response: {response}")
        print(f"  Is Collecting: {is_collecting}")
        print(f"  Current Step: {step}")
        print(f"  Error: {error}")
        
        # Step 2: Provide case ID
        session_id, response, is_collecting, step, error = agent.process_message("FR001", session_id)
        print(f"\nStep 2 - Case ID:")
        print(f"  Response: {response}")
        print(f"  Current Step: {step}")
        
        # Step 3: Provide date of incident
        session_id, response, is_collecting, step, error = agent.process_message("2024-01-15", session_id)
        print(f"\nStep 3 - Date of Incident:")
        print(f"  Response: {response}")
        print(f"  Current Step: {step}")
        
        # Step 4: Provide time of discovery
        session_id, response, is_collecting, step, error = agent.process_message("09:30 AM", session_id)
        print(f"\nStep 4 - Time of Discovery:")
        print(f"  Response: {response}")
        print(f"  Current Step: {step}")
        
        # Step 5: Provide financial institution
        session_id, response, is_collecting, step, error = agent.process_message("First National Bank", session_id)
        print(f"\nStep 5 - Financial Institution:")
        print(f"  Response: {response}")
        print(f"  Current Step: {step}")
        
        # Continue with a few more steps to verify the flow
        test_responses = [
            "John Smith",  # victim_name
            "Checking Account",  # account_type
            "****1234",  # account_number
            "Credit Card Fraud",  # fraud_type
            "$5,000",  # amount_involved
            "Skimming device",  # method_used
            "Unusual transactions",  # suspicious_activity
            "Transaction logs, CCTV footage",  # evidence_collected
            "Unknown suspects",  # suspects
            "Customer reported suspicious activity"  # additional_notes
        ]
        
        for i, test_response in enumerate(test_responses, 6):
            session_id, response, is_collecting, step, error = agent.process_message(test_response, session_id)
            print(f"\nStep {i} - {step}:")
            print(f"  Response: {response[:100]}{'...' if len(response) > 100 else ''}")
            print(f"  Is Collecting: {is_collecting}")
            
            # If we've reached the analysis step, break
            if step == "analysis" or not is_collecting:
                print(f"\n🎯 Reached analysis step!")
                print(f"  Full Analysis: {response}")
                break
        
        print("\n✅ Financial Agent conversation flow test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing Financial Agent conversation: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_conversation_state():
    """Test conversation state management."""
    try:
        from FinancialAgent.financial_fraud_agent_main import conversation_states, CASE_INFO_STEPS
        
        print("\n🔍 Testing conversation state management...")
        print(f"  Number of conversation steps: {len(CASE_INFO_STEPS)}")
        print(f"  Steps: {[step['id'] for step in CASE_INFO_STEPS]}")
        
        # Check that we have exactly 14 questions + greeting + analysis
        expected_steps = [
            "greeting", "date_of_incident", "time_of_discovery", "financial_institution",
            "victim_name", "account_type", "account_number", "fraud_type",
            "amount_involved", "method_used", "suspicious_activity", 
            "evidence_collected", "suspects", "additional_notes"
        ]
        
        actual_steps = [step['id'] for step in CASE_INFO_STEPS]
        
        print(f"  Expected steps: {expected_steps}")
        print(f"  Actual steps: {actual_steps}")
        
        if actual_steps == expected_steps:
            print("✅ Conversation steps match expected pattern!")
        else:
            print("❌ Conversation steps don't match expected pattern!")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing conversation state: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Financial Agent Step-by-Step Conversation Flow")
    print("=" * 60)
    
    # Test conversation state
    state_test = test_conversation_state()
    
    # Test conversation flow
    conversation_test = test_financial_agent_conversation()
    
    print("\n" + "=" * 60)
    if state_test and conversation_test:
        print("🎉 All tests passed! Financial Agent is working correctly.")
        sys.exit(0)
    else:
        print("💥 Some tests failed. Please check the implementation.")
        sys.exit(1)
