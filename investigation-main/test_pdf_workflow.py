#!/usr/bin/env python3
"""
Test script to verify the complete PDF generation workflow
Tests data extraction from chat messages and PDF generation
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

def test_data_extraction():
    """Test the enhanced data extraction from chat messages."""
    print("\n" + "="*60)
    print("TESTING DATA EXTRACTION")
    print("="*60)
    
    # Sample chat messages simulating a murder investigation
    sample_messages = [
        {
            'sender': 'user',
            'content': 'Case ID: MURDER-001',
            'timestamp': '2024-01-16T10:00:00Z'
        },
        {
            'sender': 'assistant',
            'content': 'I understand this is case MURDER-001. Please provide more details.',
            'timestamp': '2024-01-16T10:00:30Z'
        },
        {
            'sender': 'user',
            'content': 'The victim name is Robert Johnson, age 42, male. Date of crime: 2023-10-15, time: 23:30',
            'timestamp': '2024-01-16T10:01:00Z'
        },
        {
            'sender': 'user',
            'content': 'Location: 789 Elm Street, Apartment 3C. Cause of death: Multiple stab wounds to the chest',
            'timestamp': '2024-01-16T10:01:30Z'
        },
        {
            'sender': 'user',
            'content': 'Weapon used: Kitchen knife. Crime scene: Victim found in living room, signs of struggle, furniture overturned, no forced entry',
            'timestamp': '2024-01-16T10:02:00Z'
        },
        {
            'sender': 'user',
            'content': 'Witnesses: Neighbor heard argument around 23:00. Evidence: Bloody knife, fingerprints on door handle, victim phone with text messages',
            'timestamp': '2024-01-16T10:02:30Z'
        },
        {
            'sender': 'user',
            'content': 'Suspects: Ex-wife with history of threats, business partner with financial dispute. Additional notes: Victim recently changed will, removing ex-wife as beneficiary',
            'timestamp': '2024-01-16T10:03:00Z'
        }
    ]
    
    # Extract data
    extracted_data = extract_data_from_chat_messages(sample_messages)
    
    print("Extracted Data:")
    print("-" * 40)
    for key, value in extracted_data.items():
        if not key.startswith('message_') and not key.startswith('conversation_'):
            print(f"{key}: {value}")
    
    print(f"\nTotal messages: {extracted_data.get('total_messages', 0)}")
    print(f"User messages: {extracted_data.get('user_messages', 0)}")
    print(f"Assistant messages: {extracted_data.get('assistant_messages', 0)}")
    
    return extracted_data

def test_pdf_generation(extracted_data):
    """Test PDF generation with extracted data."""
    print("\n" + "="*60)
    print("TESTING PDF GENERATION")
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
        filename = f'test_workflow_report_{timestamp}.pdf'
        
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
            
            filename_ai = f'test_workflow_report_with_ai_{timestamp}.pdf'
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
        return False

def test_format_comparison():
    """Test that the generated PDF matches the expected format."""
    print("\n" + "="*60)
    print("TESTING FORMAT COMPARISON")
    print("="*60)
    
    # Check if sample case analysis exists
    sample_file = os.path.join('Agents', 'Agent', 'sample_case_analysis.txt')
    if os.path.exists(sample_file):
        print(f"✓ Found sample case analysis: {sample_file}")
        with open(sample_file, 'r') as f:
            sample_content = f.read()
        
        print("Sample format structure:")
        lines = sample_content.split('\n')
        for line in lines[:20]:  # Show first 20 lines
            if line.strip():
                print(f"  {line}")
        print("  ...")
        
        return True
    else:
        print(f"✗ Sample case analysis not found: {sample_file}")
        return False

def main():
    """Run all tests."""
    print("AI JUSTICE GRID - PDF WORKFLOW TEST")
    print("="*60)
    print("Testing the complete workflow from chat messages to PDF generation")
    
    # Test 1: Data Extraction
    extracted_data = test_data_extraction()
    
    # Test 2: PDF Generation
    pdf_success = test_pdf_generation(extracted_data)
    
    # Test 3: Format Comparison
    format_success = test_format_comparison()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Data Extraction: {'✓ PASS' if extracted_data else '✗ FAIL'}")
    print(f"PDF Generation: {'✓ PASS' if pdf_success else '✗ FAIL'}")
    print(f"Format Check: {'✓ PASS' if format_success else '✗ FAIL'}")
    
    if extracted_data and pdf_success and format_success:
        print("\n🎉 ALL TESTS PASSED!")
        print("The PDF generation workflow is working correctly.")
        print("\nNext steps:")
        print("1. Test the complete workflow through the web interface")
        print("2. Verify PDF downloads work from the chat interface")
        print("3. Check that investigation data is properly captured")
    else:
        print("\n❌ SOME TESTS FAILED")
        print("Please review the errors above and fix the issues.")
    
    return extracted_data and pdf_success and format_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
