#!/usr/bin/env python3
"""
Test script for Murder Investigation Storage System

This script tests the murder investigation data storage functionality.
"""

import json
from datetime import datetime
from murder_data_storage import murder_storage

def test_storage_system():
    """Test the murder investigation storage system."""
    print("Testing Murder Investigation Storage System...")
    
    # Test data
    case_id = "TEST_001"
    session_id = "test_session_123"
    
    # Sample extracted data
    extracted_data = {
        'case_id': case_id,
        'crime_date': '2024-01-15',
        'crime_time': '14:30',
        'location': '123 Main Street, Downtown',
        'victim_name': 'John Doe',
        'victim_age': '35',
        'victim_gender': 'male',
        'weapon_used': 'knife',
        'cause_of_death': 'stab wounds',
        'witnesses': 'none',
        'suspects': 'unknown',
        'evidence_found': 'fingerprints on weapon',
        'crime_scene_description': 'apartment living room',
        'additional_notes': 'door was unlocked',
        'total_messages': 20,
        'user_messages': 10,
        'assistant_messages': 10,
        'conversation_start': datetime.now().isoformat(),
        'conversation_end': datetime.now().isoformat()
    }
    
    # Sample conversation pairs
    conversation_pairs = [
        {
            'question': 'What is the Case ID for this investigation?',
            'answer': case_id,
            'timestamp': datetime.now().isoformat()
        },
        {
            'question': 'When did the crime occur?',
            'answer': '2024-01-15',
            'timestamp': datetime.now().isoformat()
        },
        {
            'question': 'What time did the crime occur?',
            'answer': '14:30',
            'timestamp': datetime.now().isoformat()
        },
        {
            'question': 'What is the victim\'s name?',
            'answer': 'John Doe',
            'timestamp': datetime.now().isoformat()
        }
    ]
    
    # Sample AI analysis
    ai_analysis = """**Comprehensive Analysis of Case TEST_001**

**1. Comprehensive Analysis of the Case**
This case involves the murder of John Doe, a 35-year-old male, found in his apartment living room on January 15, 2024, at approximately 2:30 PM. The victim suffered fatal stab wounds, indicating a violent confrontation. The unlocked door suggests either the victim knew the perpetrator or the killer had access to the premises.

**2. Potential Motives and Suspects to Consider**
• **Unknown Suspect**: Currently no identified suspects, requiring broader investigation
• **Personal Acquaintance**: The unlocked door suggests familiarity between victim and perpetrator
• **Possible Motives**: Personal dispute, robbery gone wrong, or targeted attack

**3. Recommended Investigative Approaches**
• **Forensic Analysis**: Process fingerprints found on the weapon for database matches
• **Neighborhood Canvas**: Interview neighbors for suspicious activity around 2:30 PM
• **Victim Background**: Investigate victim's personal and professional relationships
• **Security Footage**: Check for surveillance cameras in the building and surrounding area

**4. Key Evidence to Focus On and How to Analyze It**
• **Fingerprints on Weapon**: Priority analysis for AFIS database comparison
• **Crime Scene**: Detailed forensic examination for additional trace evidence
• **Entry Point**: Examine door and locks for signs of forced entry
• **Victim's Phone/Computer**: Check for recent communications or threats

**5. Possible Solutions or Conclusions**
Based on the evidence, this appears to be a targeted attack by someone known to the victim. The presence of fingerprints on the weapon provides the strongest lead for identification. Immediate focus should be on forensic analysis and victim background investigation."""
    
    # User metadata
    user_metadata = {
        'request_id': 'test_request_123',
        'user_id': 'test_user',
        'timestamp': datetime.now().isoformat(),
        'test_case': True
    }
    
    try:
        # Test storing investigation data
        print("1. Testing data storage...")
        success = murder_storage.store_investigation_data(
            case_id=case_id,
            session_id=session_id,
            extracted_data=extracted_data,
            conversation_pairs=conversation_pairs,
            ai_analysis=ai_analysis,
            user_metadata=user_metadata
        )
        
        if success:
            print("✓ Data storage successful")
        else:
            print("✗ Data storage failed")
            return False
        
        # Test retrieving case data
        print("2. Testing data retrieval...")
        case_data = murder_storage.get_case_data(case_id)
        
        if case_data:
            print("✓ Data retrieval successful")
            print(f"   Case ID: {case_data['case_metadata']['case_id']}")
            print(f"   Victim: {case_data['case_details']['victim_information']['name']}")
            print(f"   AI Analysis Generated: {case_data['ai_analysis']['generated']}")
        else:
            print("✗ Data retrieval failed")
            return False
        
        # Test getting all cases
        print("3. Testing get all cases...")
        all_cases = murder_storage.get_all_cases()
        
        if case_id in all_cases:
            print("✓ Get all cases successful")
            print(f"   Total cases stored: {len(all_cases)}")
        else:
            print("✗ Get all cases failed")
            return False
        
        # Test metadata retrieval
        print("4. Testing metadata retrieval...")
        metadata = murder_storage.get_storage_metadata()
        
        if metadata:
            print("✓ Metadata retrieval successful")
            print(f"   Total cases: {metadata['total_cases']}")
            print(f"   Last updated: {metadata['last_updated']}")
        else:
            print("✗ Metadata retrieval failed")
            return False
        
        # Test updating AI analysis
        print("5. Testing AI analysis update...")
        updated_analysis = ai_analysis + "\n\n**UPDATE**: Additional forensic evidence processed."
        
        success = murder_storage.update_ai_analysis(case_id, updated_analysis)
        
        if success:
            print("✓ AI analysis update successful")
            
            # Verify the update
            updated_case = murder_storage.get_case_data(case_id)
            if updated_case and "UPDATE" in updated_case['ai_analysis']['content']:
                print("✓ AI analysis update verified")
            else:
                print("✗ AI analysis update verification failed")
                return False
        else:
            print("✗ AI analysis update failed")
            return False
        
        print("\n🎉 All tests passed! Murder Investigation Storage System is working correctly.")
        
        # Display the stored data structure
        print("\n📋 Sample stored data structure:")
        print(json.dumps(case_data, indent=2)[:1000] + "..." if len(json.dumps(case_data, indent=2)) > 1000 else json.dumps(case_data, indent=2))
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    test_storage_system()
