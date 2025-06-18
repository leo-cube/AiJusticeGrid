#!/usr/bin/env python3
"""
Debug script to identify the exact cause of the empty PDF issue.
"""

import sys
import os
import json
from io import BytesIO

# Add the current directory to the path so we can import the modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_pdf_generator_directly():
    """Test the PDF generator directly without going through the API."""
    print("🔍 Testing PDF Generator Directly...")
    
    try:
        from dynamic_pdf_generator import DynamicPDFGenerator
        
        # Get the API key
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv('NVIDIA_API_KEY')
        
        if not api_key:
            print("❌ No NVIDIA_API_KEY found in environment")
            return False
        
        print(f"✅ API key found (length: {len(api_key)})")
        
        # Create the PDF generator
        pdf_generator = DynamicPDFGenerator(api_key)
        print("✅ PDF generator created successfully")
        
        # Test data - exactly what should be processed
        test_data = {
            "case_id": "TEST-001",
            "crime_date": "2024-01-15",
            "crime_time": "10:30 PM",
            "location": "123 Main Street",
            "victim_name": "John Doe",
            "victim_age": "35",
            "victim_gender": "Male",
            "cause_of_death": "Gunshot wound",
            "weapon_used": "9mm handgun",
            "crime_scene_description": "Living room with signs of struggle",
            "witnesses": "Neighbor heard gunshots",
            "evidence_found": "Bullet casings, fingerprints",
            "suspects": "Ex-business partner",
            "additional_notes": "Victim received threats",
            "conversation_pairs": [
                {
                    "question": "What is the case ID?",
                    "answer": "TEST-001"
                },
                {
                    "question": "When did the crime occur?",
                    "answer": "2024-01-15"
                },
                {
                    "question": "What time did it happen?",
                    "answer": "10:30 PM"
                },
                {
                    "question": "Where did it happen?",
                    "answer": "123 Main Street"
                },
                {
                    "question": "Who was the victim?",
                    "answer": "John Doe"
                }
            ]
        }
        
        print(f"📋 Test data keys: {list(test_data.keys())}")
        print(f"📋 Conversation pairs: {len(test_data['conversation_pairs'])}")
        
        # Generate the PDF
        print("🔄 Generating PDF...")
        pdf_buffer = pdf_generator.generate_investigation_pdf(
            data=test_data,
            analysis_type="murder"
        )
        
        if pdf_buffer:
            # Save the PDF
            with open("debug_direct_test.pdf", "wb") as f:
                f.write(pdf_buffer.getvalue())
            
            pdf_size = len(pdf_buffer.getvalue())
            print(f"✅ PDF generated successfully! Size: {pdf_size} bytes")
            print("📄 Saved as 'debug_direct_test.pdf'")
            
            if pdf_size > 5000:  # A reasonable PDF should be at least 5KB
                print("✅ PDF size looks good - likely contains content")
                return True
            else:
                print("⚠️  PDF size is very small - might be empty")
                return False
        else:
            print("❌ PDF generation returned None")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return False

def test_fallback_pdf_generator():
    """Test the fallback PDF generator."""
    print("\n🔍 Testing Fallback PDF Generator...")
    
    try:
        from unified_server import generate_incident_pdf
        
        # Test data for fallback generator
        test_data = {
            "case_id": "FALLBACK-TEST-001",
            "crime_date": "2024-01-15",
            "crime_time": "10:30 PM",
            "location": "123 Main Street",
            "victim_name": "John Doe",
            "victim_age": "35",
            "victim_gender": "Male",
            "cause_of_death": "Gunshot wound",
            "weapon_used": "9mm handgun",
            "crime_scene_description": "Living room with signs of struggle",
            "witnesses": "Neighbor heard gunshots",
            "evidence_found": "Bullet casings, fingerprints",
            "suspects": "Ex-business partner",
            "additional_notes": "Victim received threats",
            "conversation_pairs": [
                {
                    "question": "What is the case ID?",
                    "answer": "FALLBACK-TEST-001"
                },
                {
                    "question": "When did the crime occur?",
                    "answer": "2024-01-15"
                }
            ]
        }
        
        print(f"📋 Fallback test data keys: {list(test_data.keys())}")
        
        # Generate PDF using fallback
        print("🔄 Generating fallback PDF...")
        pdf_buffer = generate_incident_pdf(test_data)
        
        if pdf_buffer:
            # Save the PDF
            with open("debug_fallback_test.pdf", "wb") as f:
                f.write(pdf_buffer.getvalue())
            
            pdf_size = len(pdf_buffer.getvalue())
            print(f"✅ Fallback PDF generated! Size: {pdf_size} bytes")
            print("📄 Saved as 'debug_fallback_test.pdf'")
            
            if pdf_size > 3000:  # Fallback should be smaller but still substantial
                print("✅ Fallback PDF size looks good")
                return True
            else:
                print("⚠️  Fallback PDF size is very small")
                return False
        else:
            print("❌ Fallback PDF generation returned None")
            return False
            
    except Exception as e:
        print(f"❌ Fallback error: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return False

def test_data_validation():
    """Test the data validation function."""
    print("\n🔍 Testing Data Validation...")
    
    try:
        from dynamic_pdf_generator import DynamicPDFGenerator
        
        # Get API key
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv('NVIDIA_API_KEY', 'dummy')
        
        pdf_generator = DynamicPDFGenerator(api_key)
        
        # Test various values
        test_values = [
            ("John Doe", True),
            ("123 Main Street", True),
            ("2024-01-15", True),
            ("10:30 PM", True),
            ("", False),
            ("unknown", False),
            ("n/a", False),
            ("not specified", False),
            ("x", False),  # Too short
            ("35", True),
            ("Male", True),
            ("Gunshot wound to the chest", True)
        ]
        
        print("🧪 Testing validation function:")
        all_passed = True
        for value, expected in test_values:
            result = pdf_generator.validate_data_value(value)
            status = "✅" if result == expected else "❌"
            print(f"   {status} '{value}' -> {result} (expected {expected})")
            if result != expected:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Validation test error: {e}")
        return False

def main():
    """Run all debug tests."""
    print("🐛 PDF Generation Debug Script")
    print("="*50)
    
    # Test 1: Direct PDF generator
    test1_result = test_pdf_generator_directly()
    
    # Test 2: Fallback PDF generator
    test2_result = test_fallback_pdf_generator()
    
    # Test 3: Data validation
    test3_result = test_data_validation()
    
    # Summary
    print("\n" + "="*50)
    print("📊 Debug Test Results:")
    print(f"  Direct PDF Generator: {'✅ PASSED' if test1_result else '❌ FAILED'}")
    print(f"  Fallback PDF Generator: {'✅ PASSED' if test2_result else '❌ FAILED'}")
    print(f"  Data Validation: {'✅ PASSED' if test3_result else '❌ FAILED'}")
    
    if test1_result and test2_result:
        print("\n🎉 Both PDF generators work! The issue might be in the data flow.")
        print("   Check the generated PDFs to see if they contain the expected content.")
    elif test2_result and not test1_result:
        print("\n⚠️  Main PDF generator failed, but fallback works.")
        print("   The issue is likely with the DynamicPDFGenerator or NVIDIA API.")
    elif test1_result and not test2_result:
        print("\n⚠️  Main PDF generator works, but fallback failed.")
        print("   This is unusual - check the fallback implementation.")
    else:
        print("\n❌ Both PDF generators failed!")
        print("   This indicates a fundamental issue with the PDF generation setup.")
    
    if not test3_result:
        print("\n⚠️  Data validation issues detected - this could cause empty PDFs.")
    
    print("\n💡 Next steps:")
    if test1_result or test2_result:
        print("   1. Check the generated debug PDF files for content")
        print("   2. Compare with the actual PDF generation request data")
        print("   3. Check server logs for data processing issues")
    else:
        print("   1. Check NVIDIA API key configuration")
        print("   2. Verify ReportLab installation")
        print("   3. Check for missing dependencies")
    
    print("\n" + "="*50)

if __name__ == "__main__":
    main()
