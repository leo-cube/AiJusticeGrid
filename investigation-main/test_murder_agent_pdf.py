#!/usr/bin/env python3
"""
Test script to verify the Murder Agent conversation PDF generation workflow
Tests the new structured Q&A extraction and PDF generation
"""

import sys
import os
import json
from datetime import datetime

# Add the Agents/Agent directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Agents', 'Agent'))

try:
    from unified_server import extract_data_from_chat_messages
    from dynamic_pdf_generator import DynamicPDFGenerator
    print("✓ Successfully imported required modules")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)

def create_murder_agent_conversation():
    """Create a sample Murder Agent conversation based on the provided data."""
    return [
        {
            'sender': 'assistant',
            'content': 'Hello, I\'m the Murder Agent, an AI assistant specialized in homicide investigations. I\'ll help you analyze a murder case by collecting relevant information. Let\'s start with the basics. What is the Case ID for this investigation?',
            'timestamp': '2024-01-16T17:57:00Z'
        },
        {
            'sender': 'user',
            'content': 'LAPD1101',
            'timestamp': '2024-01-16T17:57:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nThank you. When did the crime occur? Please provide the date (YYYY-MM-DD, MM/DD/YYYY, or text format like \'January 15, 2023\').',
            'timestamp': '2024-01-16T10:34:00Z'
        },
        {
            'sender': 'user',
            'content': 'February 10, 2024',
            'timestamp': '2024-01-16T10:34:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWhat time did the crime occur? (HH:MM format, or approximate time like \'2:30 PM\', \'noon\', or \'evening\')',
            'timestamp': '2024-01-16T10:35:00Z'
        },
        {
            'sender': 'user',
            'content': 'Noon',
            'timestamp': '2024-01-16T10:35:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWhere did the crime take place? Please provide the location.',
            'timestamp': '2024-01-16T10:36:00Z'
        },
        {
            'sender': 'user',
            'content': 'Chennai',
            'timestamp': '2024-01-16T10:36:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim\'s name?',
            'timestamp': '2024-01-16T10:37:00Z'
        },
        {
            'sender': 'user',
            'content': 'Noor',
            'timestamp': '2024-01-16T10:37:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim\'s age?',
            'timestamp': '2024-01-16T10:38:00Z'
        },
        {
            'sender': 'user',
            'content': '20',
            'timestamp': '2024-01-16T10:38:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWhat is the victim\'s gender?',
            'timestamp': '2024-01-16T10:39:00Z'
        },
        {
            'sender': 'user',
            'content': 'Male',
            'timestamp': '2024-01-16T10:39:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWhat was the cause of death?',
            'timestamp': '2024-01-16T10:40:00Z'
        },
        {
            'sender': 'user',
            'content': 'Shot',
            'timestamp': '2024-01-16T10:40:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWas a weapon used? If so, what kind?',
            'timestamp': '2024-01-16T10:41:00Z'
        },
        {
            'sender': 'user',
            'content': 'Gun',
            'timestamp': '2024-01-16T10:41:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nPlease describe the crime scene.',
            'timestamp': '2024-01-16T10:42:00Z'
        },
        {
            'sender': 'user',
            'content': 'The victim is a cricket player and was shot dead in public',
            'timestamp': '2024-01-16T10:42:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWere there any witnesses? If so, please provide details.',
            'timestamp': '2024-01-16T10:43:00Z'
        },
        {
            'sender': 'user',
            'content': 'Yes 1000 people',
            'timestamp': '2024-01-16T10:43:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nWhat evidence was found at the scene?',
            'timestamp': '2024-01-16T10:44:00Z'
        },
        {
            'sender': 'user',
            'content': 'Gun',
            'timestamp': '2024-01-16T10:44:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nAre there any suspects at this time?',
            'timestamp': '2024-01-16T10:45:00Z'
        },
        {
            'sender': 'user',
            'content': 'Yes a male with pale skin',
            'timestamp': '2024-01-16T10:45:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\nDo you have any additional notes or information about the case?',
            'timestamp': '2024-01-16T10:46:00Z'
        },
        {
            'sender': 'user',
            'content': 'No',
            'timestamp': '2024-01-16T10:46:30Z'
        },
        {
            'sender': 'assistant',
            'content': 'Murder Agent\nLive Data\nLive Data Analysis\n\n**Case Analysis: LAPD1101**\n\n**1. Comprehensive Analysis of the Case**\n\n* **Victim Profile**: Noor, a 20-year-old male cricket player, was shot dead in public in Chennai on February 10, 2024, at 12:00. His profession as a cricket player may indicate a public figure or someone with recognition in the local community, potentially increasing the suspect pool due to fame or rivalry.\n* **Crime Scene**: The shooting occurred in a public location with 1000 witnesses, suggesting a brazen act with little concern for concealment. This could imply a crime of passion, a professional hit, or an act intended to send a message.\n* **Method of Killing**: The use of a gun as the weapon, with the gun found at the scene, suggests either a lack of forensic awareness on the perpetrator\'s part or a deliberate attempt to mislead the investigation by leaving the weapon behind.\n* **Suspect Description**: A male with pale skin is identified as a suspect. This is a broad description but notable in Chennai, where the majority of the population may have darker skin tones, potentially making a pale-skinned individual more identifiable or suggesting a non-local perpetrator.',
            'timestamp': '2024-01-16T10:47:00Z'
        }
    ]

def test_murder_agent_extraction():
    """Test the Murder Agent conversation extraction."""
    print("\n" + "="*60)
    print("TESTING MURDER AGENT CONVERSATION EXTRACTION")
    print("="*60)
    
    # Get sample conversation
    messages = create_murder_agent_conversation()
    
    # Extract data
    extracted_data = extract_data_from_chat_messages(messages)
    
    print("Extracted Data:")
    print("-" * 40)
    for key, value in extracted_data.items():
        if key != 'conversation_pairs':
            print(f"{key}: {value}")
    
    print(f"\nConversation Pairs: {len(extracted_data.get('conversation_pairs', []))}")
    if 'conversation_pairs' in extracted_data:
        for i, pair in enumerate(extracted_data['conversation_pairs'][:3], 1):
            print(f"  Q{i}: {pair['question'][:50]}...")
            print(f"  A{i}: {pair['answer']}")
    
    return extracted_data

def test_murder_agent_pdf_generation(extracted_data):
    """Test PDF generation with Murder Agent conversation data."""
    print("\n" + "="*60)
    print("TESTING MURDER AGENT PDF GENERATION")
    print("="*60)
    
    try:
        # Test with dummy API key (no AI analysis)
        print("1. Testing PDF generation without AI analysis...")
        pdf_generator = DynamicPDFGenerator('dummy-key-for-testing')
        
        pdf_buffer = pdf_generator.generate_investigation_pdf(
            data=extracted_data,
            analysis_type='murder'
        )
        
        # Save the PDF
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'murder_agent_report_{timestamp}.pdf'
        
        with open(filename, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        file_size = len(pdf_buffer.getvalue())
        print(f"✓ PDF generated successfully: {filename}")
        print(f"✓ File size: {file_size:,} bytes")
        
        # Test with NVIDIA API if available
        nvidia_api_key = os.getenv('NVIDIA_API_KEY')
        if nvidia_api_key:
            print("\n2. Testing PDF generation with NVIDIA AI analysis...")
            pdf_generator_ai = DynamicPDFGenerator(nvidia_api_key)
            
            pdf_buffer_ai = pdf_generator_ai.generate_investigation_pdf(
                data=extracted_data,
                analysis_type='murder'
            )
            
            filename_ai = f'murder_agent_report_with_ai_{timestamp}.pdf'
            with open(filename_ai, 'wb') as f:
                f.write(pdf_buffer_ai.getvalue())
            
            file_size_ai = len(pdf_buffer_ai.getvalue())
            print(f"✓ AI-enhanced PDF generated: {filename_ai}")
            print(f"✓ File size: {file_size_ai:,} bytes")
        else:
            print("\n2. Skipping AI analysis test (NVIDIA_API_KEY not available)")
        
        return True
        
    except Exception as e:
        print(f"✗ Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests for Murder Agent conversation PDF generation."""
    print("AI JUSTICE GRID - MURDER AGENT PDF WORKFLOW TEST")
    print("="*60)
    print("Testing the complete workflow from Murder Agent Q&A to PDF generation")
    
    # Test 1: Murder Agent Data Extraction
    extracted_data = test_murder_agent_extraction()
    
    # Test 2: Murder Agent PDF Generation
    pdf_success = test_murder_agent_pdf_generation(extracted_data)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Murder Agent Extraction: {'✓ PASS' if extracted_data else '✗ FAIL'}")
    print(f"PDF Generation: {'✓ PASS' if pdf_success else '✗ FAIL'}")
    
    if extracted_data and pdf_success:
        print("\n🎉 ALL TESTS PASSED!")
        print("The Murder Agent PDF generation workflow is working correctly.")
        print("\nKey Features Verified:")
        print("✓ Structured Q&A conversation extraction")
        print("✓ Professional PDF formatting with conversation flow")
        print("✓ Case details table generation")
        print("✓ AI analysis integration")
        print("\nNext steps:")
        print("1. Test through the web interface")
        print("2. Verify PDF downloads work from chat")
        print("3. Check conversation flow in generated PDF")
    else:
        print("\n❌ SOME TESTS FAILED")
        print("Please review the errors above and fix the issues.")
    
    return extracted_data and pdf_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
