#!/usr/bin/env python3
"""
Test script to verify that PDF generation formatting fixes work correctly.
Tests removal of markdown formatting and unwanted user metadata.
"""

import os
import sys
import json
from datetime import datetime

# Add the current directory to Python path
sys.path.append('.')
sys.path.append('./Agents/Agent')

try:
    from Agents.Agent.dynamic_pdf_generator import DynamicPDFGenerator
    from Agents.Agent.unified_server import extract_data_from_chat_messages
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're running from the investigation-main directory")
    sys.exit(1)

def test_markdown_cleaning():
    """Test that markdown formatting is properly cleaned from text."""
    print("Testing markdown text cleaning...")

    # Create PDF generator instance
    pdf_generator = DynamicPDFGenerator('dummy-key')

    # Test cases with various markdown formatting
    test_cases = [
        {
            'input': '**Bold text** with *italic* and __underlined__ text',
            'expected_clean': 'Bold text with italic and underlined text'
        },
        {
            'input': '# Header 1\n## Header 2\n### Header 3',
            'expected_clean': 'Header 1 Header 2 Header 3'
        },
        {
            'input': '- Bullet point 1\n+ Bullet point 2\n* Bullet point 3',
            'expected_clean': 'Bullet point 1 Bullet point 2 Bullet point 3'
        },
        {
            'input': 'Normal text with **bold** and - bullet points',
            'expected_clean': 'Normal text with bold and bullet points'
        }
    ]

    all_passed = True
    for i, test_case in enumerate(test_cases, 1):
        result = pdf_generator.clean_markdown_text(test_case['input'])
        if result == test_case['expected_clean']:
            print(f"✅ Test {i}: PASSED")
        else:
            print(f"❌ Test {i}: FAILED")
            print(f"   Input: {test_case['input']}")
            print(f"   Expected: {test_case['expected_clean']}")
            print(f"   Got: {result}")
            all_passed = False

    return all_passed

def test_userid_filtering():
    """Test that userId and unwanted metadata are filtered out."""
    print("\nTesting userId and metadata filtering...")

    # Create PDF generator instance
    pdf_generator = DynamicPDFGenerator('dummy-key')

    # Test data with unwanted fields
    test_data = {
        'case_id': '001',
        'victim_name': 'Loki',
        'location': '789 Elm Street',
        'userId': 'user',  # This should be filtered out
        'userid': 'test_user',  # This should be filtered out
        'sessionId': 'session123',  # This should be filtered out
        'requestId': 'req456',  # This should be filtered out
        'weapon': 'cricket bat'
    }

    # Format case details table
    details = pdf_generator.format_case_details_table(test_data)

    # Check that unwanted fields are not included
    detail_text = str(details)

    unwanted_fields = ['userId', 'userid', 'sessionId', 'requestId']
    all_filtered = True

    for field in unwanted_fields:
        if field in detail_text or field.lower() in detail_text.lower():
            print(f"❌ Field '{field}' was not filtered out")
            all_filtered = False
        else:
            print(f"✅ Field '{field}' successfully filtered out")

    # Check that wanted fields are still included (check for display names)
    wanted_display_names = ['Case ID:', 'Victim Name:', 'Location:', 'Weapon Used:']
    for display_name in wanted_display_names:
        if any(display_name in str(detail) for detail in details):
            print(f"✅ Field '{display_name}' correctly included")
        else:
            print(f"❌ Field '{display_name}' was incorrectly filtered out")
            all_filtered = False

    return all_filtered

def test_full_pdf_generation():
    """Test complete PDF generation with cleaned formatting."""
    print("\nTesting full PDF generation with formatting fixes...")

    try:
        # Sample chat messages with markdown formatting
        chat_messages = [
            {
                "sender": "assistant",
                "content": "**Murder Agent**\n\n# Live Data Analysis\n\nWhat is the case ID?",
                "timestamp": "2025-01-16T10:00:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "001",
                "timestamp": "2025-01-16T10:00:30Z"
            },
            {
                "sender": "assistant",
                "content": "**Murder Agent**\n\n## Live Data Analysis\n\nWho is the victim?",
                "timestamp": "2025-01-16T10:01:00Z",
                "agentType": "murder"
            },
            {
                "sender": "user",
                "content": "Loki",
                "timestamp": "2025-01-16T10:01:30Z"
            }
        ]

        # Extract data from messages
        extracted_data = extract_data_from_chat_messages(chat_messages)

        # Add some test metadata that should be filtered
        extracted_data['userId'] = 'user'
        extracted_data['sessionId'] = 'test_session'

        print(f"Extracted data keys: {list(extracted_data.keys())}")

        # Generate PDF
        pdf_generator = DynamicPDFGenerator('dummy-key')
        pdf_buffer = pdf_generator.generate_investigation_pdf(
            data=extracted_data,
            analysis_type='murder'
        )

        # Save test PDF
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'test_formatting_fix_{timestamp}.pdf'

        with open(filename, 'wb') as f:
            f.write(pdf_buffer.getvalue())

        file_size = len(pdf_buffer.getvalue())
        print(f"✅ PDF generated successfully: {filename} ({file_size:,} bytes)")

        return True

    except Exception as e:
        print(f"❌ Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all formatting fix tests."""
    print("PDF FORMATTING FIXES TEST")
    print("=" * 50)

    # Run all tests
    test_results = []

    test_results.append(test_markdown_cleaning())
    test_results.append(test_userid_filtering())
    test_results.append(test_full_pdf_generation())

    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)

    passed_tests = sum(test_results)
    total_tests = len(test_results)

    if passed_tests == total_tests:
        print(f"✅ ALL TESTS PASSED ({passed_tests}/{total_tests})")
        print("\n🎉 PDF formatting fixes are working correctly!")
        print("   - Markdown formatting is properly cleaned")
        print("   - Unwanted user metadata is filtered out")
        print("   - PDF generation produces clean, readable text")
    else:
        print(f"❌ SOME TESTS FAILED ({passed_tests}/{total_tests})")
        print("\n⚠️  Please review the failed tests above")

    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
