#!/usr/bin/env python3
"""
Direct test of PDF generation functionality without server
"""

import os
import sys
from datetime import datetime

def test_direct_pdf_generation():
    """Test PDF generation directly without server"""
    
    try:
        # Import the PDF generator
        from dynamic_pdf_generator import DynamicPDFGenerator
        
        print("✓ Successfully imported DynamicPDFGenerator")
        
        # Sample test data from chat conversation
        test_data = {
            'case_id': '001',
            'date': '2023-10-15',
            'time': '23:30',
            'location': '789 Elm Street, Apartment 3C',
            'name': 'Robert Johnson',
            'age': '42',
            'victim_gender': 'male',
            'cause_of_death': 'Multiple stab wounds to the chest',
            'weapon_used': 'knife',
            'crime_scene_description': 'Victim found in living room. Signs of struggle. Furniture overturned. No signs of forced entry.',
            'witnesses': 'Neighbor heard argument around 23:00',
            'evidence_found': 'Bloody knife, fingerprints on door handle, victim\'s phone with text messages',
            'suspects': 'Ex-wife with history of threats, business partner with financial dispute',
            'additional_notes': 'Victim recently changed his will, removing ex-wife as beneficiary',
            'total_messages': 14,
            'user_messages': 7,
            'assistant_messages': 7,
            'requestId': 'test_123',
            'sessionId': 'test_session',
            'message_1': 'Case ID: 001',
            'message_2': 'Date: 2023-10-15',
            'message_3': 'Time: 23:30',
            'message_4': 'Location: 789 Elm Street, Apartment 3C',
            'message_5': 'Victim: Robert Johnson, age 42, male',
            'message_6': 'Cause of death: Multiple stab wounds to the chest',
            'message_7': 'Additional notes: Victim recently changed his will, removing ex-wife as beneficiary'
        }
        
        # Test 1: Basic PDF without AI analysis
        print("\nTest 1: Basic PDF Generation (without AI analysis)")
        
        pdf_generator = DynamicPDFGenerator('dummy-key-for-testing')
        
        pdf_buffer = pdf_generator.generate_pdf(
            data=test_data,
            title='Murder Investigation Report - Test Case',
            analysis_type='murder',
            include_ai_analysis=False
        )
        
        # Save the PDF
        output_file = f'test_murder_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        with open(output_file, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        file_size = len(pdf_buffer.getvalue())
        print(f"✓ Basic PDF generated successfully: {output_file}")
        print(f"✓ File size: {file_size:,} bytes")
        
        # Test 2: PDF with AI analysis (if NVIDIA API key is available)
        nvidia_api_key = os.getenv('NVIDIA_API_KEY')
        if nvidia_api_key and nvidia_api_key != 'dummy-key-for-testing':
            print("\nTest 2: PDF Generation with AI Analysis")
            
            pdf_generator_ai = DynamicPDFGenerator(nvidia_api_key)
            
            pdf_buffer_ai = pdf_generator_ai.generate_pdf(
                data=test_data,
                title='Murder Investigation Report with AI Analysis',
                analysis_type='murder',
                include_ai_analysis=True
            )
            
            output_file_ai = f'test_murder_report_ai_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            with open(output_file_ai, 'wb') as f:
                f.write(pdf_buffer_ai.getvalue())
            
            file_size_ai = len(pdf_buffer_ai.getvalue())
            print(f"✓ AI-enhanced PDF generated successfully: {output_file_ai}")
            print(f"✓ File size: {file_size_ai:,} bytes")
            
        else:
            print("\nTest 2: Skipped (NVIDIA_API_KEY not available)")
            print("To test AI analysis, set NVIDIA_API_KEY environment variable")
        
        # Test 3: Different analysis types
        print("\nTest 3: Different Analysis Types")
        
        analysis_types = ['general', 'investigation', 'business', 'financial', 'legal']
        
        for analysis_type in analysis_types:
            try:
                pdf_buffer_type = pdf_generator.generate_pdf(
                    data={'test_data': f'Sample data for {analysis_type} analysis'},
                    title=f'{analysis_type.title()} Analysis Report',
                    analysis_type=analysis_type,
                    include_ai_analysis=False
                )
                
                output_file_type = f'test_{analysis_type}_report.pdf'
                with open(output_file_type, 'wb') as f:
                    f.write(pdf_buffer_type.getvalue())
                
                print(f"✓ {analysis_type.title()} PDF: {output_file_type}")
                
            except Exception as e:
                print(f"✗ Error generating {analysis_type} PDF: {str(e)}")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {str(e)}")
        print("Make sure reportlab is installed: pip install reportlab")
        return False
        
    except Exception as e:
        print(f"✗ Error during PDF generation: {str(e)}")
        return False

def test_chat_data_extraction():
    """Test the chat message data extraction functionality"""
    
    print("\nTest 4: Chat Data Extraction")
    
    # Sample chat messages
    sample_messages = [
        {'sender': 'user', 'content': 'Case ID: 001', 'timestamp': '2023-10-15T10:00:00Z'},
        {'sender': 'assistant', 'content': 'Thank you. When did the crime occur?', 'timestamp': '2023-10-15T10:00:01Z'},
        {'sender': 'user', 'content': '2023-10-15', 'timestamp': '2023-10-15T10:00:30Z'},
        {'sender': 'assistant', 'content': 'What time did the crime occur?', 'timestamp': '2023-10-15T10:00:31Z'},
        {'sender': 'user', 'content': '23:30', 'timestamp': '2023-10-15T10:01:00Z'},
        {'sender': 'assistant', 'content': 'Where did the crime take place?', 'timestamp': '2023-10-15T10:01:01Z'},
        {'sender': 'user', 'content': '789 Elm Street, Apartment 3C', 'timestamp': '2023-10-15T10:01:30Z'},
        {'sender': 'user', 'content': 'Victim name: Robert Johnson, age 42', 'timestamp': '2023-10-15T10:02:00Z'},
    ]
    
    try:
        # Import the extraction function from unified_server
        sys.path.append('.')
        from unified_server import extract_data_from_chat_messages
        
        extracted_data = extract_data_from_chat_messages(sample_messages)
        
        print("✓ Data extraction successful")
        print("Extracted data:")
        for key, value in extracted_data.items():
            if not key.startswith('message_'):
                print(f"  {key}: {value}")
        
        # Generate PDF with extracted data
        from dynamic_pdf_generator import DynamicPDFGenerator
        
        pdf_generator = DynamicPDFGenerator('dummy-key')
        pdf_buffer = pdf_generator.generate_pdf(
            data=extracted_data,
            title='Chat-Based Investigation Report',
            analysis_type='investigation',
            include_ai_analysis=False
        )
        
        output_file = f'test_chat_extraction_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        with open(output_file, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        print(f"✓ Chat-based PDF generated: {output_file}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error in chat data extraction test: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Direct PDF Generation Test ===\n")
    
    # Test basic PDF generation
    test1_result = test_direct_pdf_generation()
    
    # Test chat data extraction
    test2_result = test_chat_data_extraction()
    
    print("\n=== Test Summary ===")
    print(f"Direct PDF Generation: {'✓ PASSED' if test1_result else '✗ FAILED'}")
    print(f"Chat Data Extraction: {'✓ PASSED' if test2_result else '✗ FAILED'}")
    
    if test1_result and test2_result:
        print("\n🎉 All tests passed! PDF generation system is working correctly.")
        print("\nGenerated files:")
        import glob
        pdf_files = glob.glob("test_*.pdf")
        for pdf_file in pdf_files:
            print(f"  - {pdf_file}")
    else:
        print("\n❌ Some tests failed. Check the error messages above.")
    
    print("\nTo integrate with the chat interface:")
    print("1. Set NVIDIA_API_KEY environment variable for AI analysis")
    print("2. Start the unified server: python unified_server.py")
    print("3. Use the PDF generation button in the chat interface")
