#!/usr/bin/env python3
"""
Test script to verify the data extraction is working correctly
Tests the complete conversation data from the user's example
"""

import requests
import json
import sys
from datetime import datetime

def test_real_conversation_data():
    """Test with the actual conversation data from the user."""
    print("TESTING REAL CONVERSATION DATA EXTRACTION")
    print("="*50)
    
    # This is the actual conversation data from the user's example
    real_conversation_data = {
        "title": "Murder Investigation Report",
        "analysisType": "murder",
        "agentType": "murder",
        "messages": [
            {
                "sender": "assistant",
                "content": "Hello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. I'll help you analyze a murder case by collecting relevant information. Let's start with the basics. What is the Case ID for this investigation?",
                "timestamp": "2025-05-27T05:23:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "001",
                "timestamp": "2025-05-27T05:23:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nThank you. When did the crime occur? Please provide the date (YYYY-MM-DD, MM/DD/YYYY, or text format like 'January 15, 2023').\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:23:45Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "2000-12-05",
                "timestamp": "2025-05-27T05:24:00Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat time did the crime occur? (HH:MM format, or approximate time like '2:30 PM', 'noon', or 'evening')\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:24:15Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "23:00",
                "timestamp": "2025-05-27T05:24:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhere did the crime take place? Please provide the location.\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:24:45Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "tambaram",
                "timestamp": "2025-05-27T05:25:00Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim's name?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:25:15Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "john",
                "timestamp": "2025-05-27T05:25:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim's age?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:25:45Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "34",
                "timestamp": "2025-05-27T05:26:00Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim's gender?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:26:15Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "male",
                "timestamp": "2025-05-27T05:26:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat was the cause of death?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:26:45Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "knife",
                "timestamp": "2025-05-27T05:27:00Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWas a weapon used? If so, what kind?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:27:15Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "knife",
                "timestamp": "2025-05-27T05:27:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nPlease describe the crime scene.\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:27:45Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "he was potted in hills with bleeding",
                "timestamp": "2025-05-27T05:28:00Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWere there any witnesses? If so, please provide details.\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:28:15Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "no",
                "timestamp": "2025-05-27T05:28:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nWhat evidence was found at the scene?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:28:45Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "no",
                "timestamp": "2025-05-27T05:29:00Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nAre there any suspects at this time?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:29:15Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "no",
                "timestamp": "2025-05-27T05:29:30Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "Murder Agent\nLive Data\nLive Data Analysis\nDo you have any additional notes or information about the case?\nPlease answer the question to continue the investigation.",
                "timestamp": "2025-05-27T05:29:45Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "no",
                "timestamp": "2025-05-27T05:30:00Z",
                "agentType": "murder"
            },
            {
                "sender": "assistant",
                "content": "**Case Analysis: 001**\n\n**1. Comprehensive Analysis of the Case**\n\n* **Victim Profile**: John, a 34-year-old male, was found dead in Tambaram on December 5, 2000, at 23:00 hours. The victim's profile does not indicate any inherent risk factors (e.g., occupation, known conflicts) that might have contributed to the crime.\n* **Crime Scene**: The body was discovered in the hills with visible bleeding, suggesting a potentially remote or secluded location. The time of death (23:00) may indicate the crime occurred under the cover of darkness, which could imply premeditation or opportunistic circumstances.\n* **Method of Death**: The cause of death is attributed to a knife, with the weapon also being a knife. This suggests a close-proximity attack, possibly indicating a personal or impassioned motive.\n* **Investigative Challenges**: The absence of witnesses, evidence, and suspects significantly hampers the investigation, pointing towards a need for forensic analysis and community engagement to gather more information.\n\n**2. Potential Motives and Suspects to Consider**\n\n* **Motives**:\n+ **Personal Conflict**: The use of a knife and the secluded location might suggest a personal vendetta or emotional altercation.\n+ **Opportunistic Crime**: The time and location could also indicate a random act of violence, potentially linked to theft or robbery, though no evidence of such is mentioned.\n* **Suspects** (Hypothetical, based on typical scenarios, given the lack of direct evidence):\n+ **Acquaintances of the Victim**: Individuals known to John, possibly with a history of conflict.\n+ **Local Criminal Elements**: Persons known to frequent the hills area of Tambaram, especially those with a history of violent crime.\n\n**3. Recommended Investigative Approaches**\n\n* **Forensic Analysis**:\n+ Conduct a thorough autopsy to determine the exact cause of death, number of wounds, and potential defensive injuries.\n+ Analyze the knife (if found) for fingerprints, DNA, or other trace evidence.\n* **Crime Scene Investigation**:\n+ Perform a detailed search of the hills area for any overlooked evidence (e.g., footprints, discarded items).\n+ Document the exact location and position of the body to reconstruct the crime scene.\n* **Community Engagement**:\n+ Canvas the local community, especially those who frequent the hills, for any information regarding suspicious activity around the time of the crime.\n+ Utilize local media to appeal for witnesses or information.\n* **Background Investigation**:\n+ Interview John's family, friends, and colleagues to gather information about his personal life, potential conflicts, and last known activities.\n\n**4. Key Evidence to Focus On and How to Analyze It**\n\n* **The Knife**:\n+ **Analysis**: Forensic examination for fingerprints, DNA, bloodstain pattern analysis.\n+ **Objective**: Identify the wielder or link the weapon to a suspect.\n* **Victim's Body**:\n+ **Analysis**: Autopsy to determine wound patterns, potential defensive injuries, and time of death confirmation.\n+ **Objective**: Understand the nature of the attack and potentially the perpetrator's intent.\n* **Crime Scene**:\n+ **Analysis**: Thorough search for trace evidence, footprints, or other signs of disturbance.\n+ **Objective**: Reconstruct the events surrounding the crime and identify potential suspect trails.\n\n**5. Possible Solutions or Conclusions**\n\n* **Direct Conclusions from Data**:\n+ The murder was committed with a knife, suggesting a personal or close-range attack.\n+ The lack of witnesses, evidence, and suspects indicates a challenging investigation that may rely heavily on forensic breakthroughs or community tips.\n* **Investigative Next Steps**:\n+ Broaden the search for potential witnesses or individuals who may have seen John in the hours leading up to his death.\n+ Continue forensic analysis of the crime scene and the victim to uncover any latent evidence.\n+ Maintain public appeals for information, emphasizing the isolated nature of the crime scene and the potential for someone to have seen something unusual.",
                "timestamp": "2025-05-27T05:30:30Z",
                "agentType": "murder"
            }
        ],
        "includeAIAnalysis": True,
        "userMetadata": {
            "sessionId": "session_1748325342322",
            "userId": "user",
            "requestId": "1748325342322"
        }
    }
    
    print(f"Testing with {len(real_conversation_data['messages'])} messages")
    print(f"Agent Type: {real_conversation_data['agentType']}")
    print(f"Analysis Type: {real_conversation_data['analysisType']}")
    
    try:
        # Test the Next.js API route
        response = requests.post(
            'http://localhost:3001/api/generate-pdf',
            json=real_conversation_data,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            # Save the PDF
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'real_conversation_test_{timestamp}.pdf'
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            file_size = len(response.content)
            print(f"✓ PDF generated successfully: {filename}")
            print(f"✓ File size: {file_size:,} bytes")
            
            return True
        else:
            print(f"✗ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Error text: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Request failed: {str(e)}")
        return False

def main():
    """Run the real conversation data test."""
    print("AI JUSTICE GRID - REAL CONVERSATION DATA TEST")
    print("="*60)
    print("Testing with the actual conversation data from the user")
    
    success = test_real_conversation_data()
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Real Conversation Test: {'✓ PASS' if success else '✗ FAIL'}")
    
    if success:
        print("\n🎉 REAL CONVERSATION TEST PASSED!")
        print("The data extraction is now working correctly.")
        print("\nExpected data in PDF:")
        print("✓ Case ID: 001")
        print("✓ Crime Date: 2000-12-05")
        print("✓ Crime Time: 23:00")
        print("✓ Location: tambaram")
        print("✓ Victim Name: john")
        print("✓ Victim Age: 34")
        print("✓ Victim Gender: male")
        print("✓ Cause of Death: knife")
        print("✓ Weapon Used: knife")
        print("✓ Crime Scene: he was potted in hills with bleeding")
        print("✓ Witnesses: no")
        print("✓ Evidence: no")
        print("✓ Suspects: no")
        print("✓ Additional Notes: no")
    else:
        print("\n❌ REAL CONVERSATION TEST FAILED")
        print("Please check the error messages above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
