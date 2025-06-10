#!/usr/bin/env python3
"""
Test script to verify PDF generation works in production environment.
This script tests the PDF generation functionality with sample data.
"""

import os
import sys
import json
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_murder_pdf_generation():
    """Test murder PDF generation with sample data."""
    try:
        # Import the PDF generator
        from murder_pdf_generator import MurderPDFGenerator
        
        # Sample murder case data
        sample_data = {
            'case_id': 'TEST-MURDER-001',
            'crime_date': '2024-01-15',
            'crime_time': '10:30 PM',
            'location': '123 Main Street, Downtown',
            'victim_name': 'John Doe',
            'victim_age': '35',
            'victim_gender': 'Male',
            'cause_of_death': 'Gunshot wound to chest',
            'weapon_used': '9mm handgun',
            'crime_scene_description': 'Victim found in living room, signs of struggle',
            'witnesses': 'Neighbor heard gunshots around 10:30 PM',
            'evidence_found': 'Shell casing, fingerprints on door handle',
            'suspects': 'Ex-business partner with financial motive',
            'conversation_pairs': [
                {
                    'question': 'What is the case ID for this murder investigation?',
                    'answer': 'TEST-MURDER-001'
                },
                {
                    'question': 'When did the crime occur?',
                    'answer': '2024-01-15 at 10:30 PM'
                },
                {
                    'question': 'Where did the crime take place?',
                    'answer': '123 Main Street, Downtown'
                }
            ]
        }
        
        # Initialize PDF generator
        pdf_generator = MurderPDFGenerator()
        
        # Generate PDF
        logger.info("Generating murder PDF...")
        pdf_buffer = pdf_generator.generate_murder_pdf(sample_data)
        
        # Check if PDF was generated successfully
        if pdf_buffer and pdf_buffer.getbuffer().nbytes > 100:
            logger.info(f"✅ Murder PDF generated successfully! Size: {pdf_buffer.getbuffer().nbytes} bytes")
            return True
        else:
            logger.error("❌ Murder PDF generation failed - empty or corrupted PDF")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error testing murder PDF generation: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def test_dynamic_pdf_generation():
    """Test dynamic PDF generation with sample data."""
    try:
        # Import the PDF generator
        from dynamic_pdf_generator import DynamicPDFGenerator
        
        # Get NVIDIA API key (optional for testing)
        nvidia_api_key = os.getenv('NVIDIA_API_KEY', 'test-key')
        
        # Sample case data
        sample_data = {
            'case_id': 'TEST-DYNAMIC-001',
            'crime_date': '2024-01-15',
            'location': '456 Oak Avenue',
            'victim_name': 'Jane Smith',
            'conversation_pairs': [
                {
                    'question': 'What is the case ID?',
                    'answer': 'TEST-DYNAMIC-001'
                },
                {
                    'question': 'When did the incident occur?',
                    'answer': '2024-01-15'
                }
            ]
        }
        
        # Initialize PDF generator
        pdf_generator = DynamicPDFGenerator(nvidia_api_key)
        
        # Generate PDF
        logger.info("Generating dynamic PDF...")
        pdf_buffer = pdf_generator.generate_investigation_pdf(sample_data, 'murder')
        
        # Check if PDF was generated successfully
        if pdf_buffer and pdf_buffer.getbuffer().nbytes > 100:
            logger.info(f"✅ Dynamic PDF generated successfully! Size: {pdf_buffer.getbuffer().nbytes} bytes")
            return True
        else:
            logger.error("❌ Dynamic PDF generation failed - empty or corrupted PDF")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error testing dynamic PDF generation: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def test_reportlab_availability():
    """Test if ReportLab is available and working."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph
        from io import BytesIO
        
        # Create a simple test PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = [Paragraph("Test PDF Generation", styles['Title'])]
        doc.build(story)
        
        if buffer.getbuffer().nbytes > 100:
            logger.info("✅ ReportLab is working correctly")
            return True
        else:
            logger.error("❌ ReportLab test failed - empty PDF")
            return False
            
    except Exception as e:
        logger.error(f"❌ ReportLab test failed: {str(e)}")
        return False

def main():
    """Run all PDF generation tests."""
    logger.info("🧪 Starting PDF Generation Tests...")
    logger.info("=" * 50)
    
    # Test ReportLab availability
    logger.info("1. Testing ReportLab availability...")
    reportlab_ok = test_reportlab_availability()
    
    # Test murder PDF generation
    logger.info("\n2. Testing Murder PDF generation...")
    murder_pdf_ok = test_murder_pdf_generation()
    
    # Test dynamic PDF generation
    logger.info("\n3. Testing Dynamic PDF generation...")
    dynamic_pdf_ok = test_dynamic_pdf_generation()
    
    # Summary
    logger.info("\n" + "=" * 50)
    logger.info("📊 TEST RESULTS SUMMARY:")
    logger.info(f"ReportLab: {'✅ PASS' if reportlab_ok else '❌ FAIL'}")
    logger.info(f"Murder PDF: {'✅ PASS' if murder_pdf_ok else '❌ FAIL'}")
    logger.info(f"Dynamic PDF: {'✅ PASS' if dynamic_pdf_ok else '❌ FAIL'}")
    
    all_tests_passed = reportlab_ok and murder_pdf_ok and dynamic_pdf_ok
    
    if all_tests_passed:
        logger.info("\n🎉 All tests PASSED! PDF generation is working correctly.")
        return 0
    else:
        logger.error("\n💥 Some tests FAILED! Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
