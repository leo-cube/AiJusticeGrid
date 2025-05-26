#!/usr/bin/env python3
"""
Demo script showing NVIDIA AI-powered PDF generation
"""

import os
from datetime import datetime
from dynamic_pdf_generator import DynamicPDFGenerator

def demo_nvidia_pdf():
    """Demonstrate PDF generation with NVIDIA AI analysis"""
    
    print("=== NVIDIA AI-Powered PDF Generation Demo ===\n")
    
    # Check for NVIDIA API key
    nvidia_api_key = os.getenv('NVIDIA_API_KEY')
    if not nvidia_api_key:
        print("❌ NVIDIA_API_KEY environment variable not found")
        print("\nTo run this demo with AI analysis:")
        print("1. Get your NVIDIA API key from https://build.nvidia.com/")
        print("2. Set the environment variable:")
        print("   export NVIDIA_API_KEY='your-api-key-here'")
        print("3. Run this demo again")
        print("\nRunning demo without AI analysis...")
        nvidia_api_key = 'dummy-key-for-demo'
        use_ai = False
    else:
        print(f"✅ NVIDIA API key found (length: {len(nvidia_api_key)})")
        use_ai = True
    
    # Sample investigation data
    investigation_cases = [
        {
            'title': 'Murder Investigation Report',
            'analysis_type': 'murder',
            'data': {
                'case_id': 'MUR-2023-001',
                'date': '2023-10-15',
                'time': '23:30',
                'location': '789 Elm Street, Apartment 3C',
                'victim_name': 'Robert Johnson',
                'victim_age': '42',
                'victim_gender': 'Male',
                'cause_of_death': 'Multiple stab wounds to the chest',
                'weapon_used': 'Kitchen knife',
                'crime_scene': 'Living room with signs of struggle, furniture overturned',
                'witnesses': 'Neighbor heard argument around 23:00',
                'evidence': 'Bloody knife, fingerprints on door handle, victim\'s phone with threatening text messages',
                'suspects': 'Ex-wife Sarah Johnson (history of domestic disputes), Business partner Mike Chen (financial dispute over $100,000)',
                'additional_notes': 'Victim recently changed will, removing ex-wife as beneficiary. Life insurance policy worth $500,000.',
                'investigating_officer': 'Detective Smith',
                'case_status': 'Active Investigation'
            }
        },
        {
            'title': 'Financial Fraud Investigation',
            'analysis_type': 'fraud',
            'data': {
                'case_id': 'FR-2023-002',
                'date_reported': '2023-11-01',
                'fraud_type': 'Embezzlement',
                'amount_involved': '$250,000',
                'victim_company': 'TechCorp Industries',
                'suspect_name': 'Jennifer Walsh',
                'suspect_position': 'Senior Accountant',
                'discovery_method': 'Internal audit revealed discrepancies',
                'time_period': 'January 2022 - October 2023',
                'evidence': 'Falsified invoices, unauthorized wire transfers, altered financial records',
                'bank_accounts': '3 suspicious accounts in suspect\'s name',
                'modus_operandi': 'Created fake vendor accounts, approved fraudulent payments',
                'red_flags': 'Lifestyle beyond means, reluctance to take vacation, defensive about financial records',
                'estimated_loss': '$247,850',
                'recovery_potential': 'Moderate - some assets frozen',
                'case_status': 'Under Investigation'
            }
        },
        {
            'title': 'Theft Investigation Report',
            'analysis_type': 'theft',
            'data': {
                'case_id': 'TH-2023-003',
                'date': '2023-12-05',
                'time': '02:15',
                'location': 'Electronics Store - 456 Main Street',
                'theft_type': 'Burglary',
                'items_stolen': 'Laptops (15 units), Smartphones (25 units), Tablets (10 units)',
                'estimated_value': '$75,000',
                'entry_method': 'Forced entry through rear door',
                'security_measures': 'Alarm system (disabled), CCTV cameras (footage obtained)',
                'witnesses': 'Security guard noticed suspicious vehicle at 02:00',
                'evidence': 'Fingerprints on door frame, tire tracks, CCTV footage of suspects',
                'suspects': '2-3 individuals, vehicle license plate partially visible',
                'modus_operandi': 'Professional operation, knew alarm system, targeted high-value items',
                'similar_cases': '3 similar burglaries in the area within 2 months',
                'investigation_leads': 'Vehicle registration, fingerprint analysis, fence operations',
                'case_status': 'Active Investigation'
            }
        }
    ]
    
    # Initialize PDF generator
    try:
        pdf_generator = DynamicPDFGenerator(nvidia_api_key)
        print("✅ PDF generator initialized successfully\n")
    except Exception as e:
        print(f"❌ Error initializing PDF generator: {str(e)}")
        return
    
    # Generate PDFs for each case
    generated_files = []
    
    for i, case in enumerate(investigation_cases, 1):
        print(f"📄 Generating PDF {i}/{len(investigation_cases)}: {case['title']}")
        
        try:
            # Generate PDF
            pdf_buffer = pdf_generator.generate_pdf(
                data=case['data'],
                title=case['title'],
                analysis_type=case['analysis_type'],
                include_ai_analysis=use_ai
            )
            
            # Create filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_title = case['title'].replace(' ', '_').replace('/', '_')
            filename = f"demo_{safe_title}_{timestamp}.pdf"
            
            # Save PDF
            with open(filename, 'wb') as f:
                f.write(pdf_buffer.getvalue())
            
            file_size = len(pdf_buffer.getvalue())
            print(f"   ✅ Generated: {filename} ({file_size:,} bytes)")
            generated_files.append(filename)
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    # Summary
    print(f"\n=== Demo Complete ===")
    print(f"Generated {len(generated_files)} PDF reports:")
    
    for filename in generated_files:
        print(f"  📄 {filename}")
    
    if use_ai:
        print(f"\n🤖 AI Analysis: Enabled (using NVIDIA API)")
        print("   Each PDF includes comprehensive AI-powered analysis")
    else:
        print(f"\n🤖 AI Analysis: Disabled (no API key)")
        print("   PDFs contain structured data without AI insights")
    
    print(f"\n💡 Tips:")
    print("   - Open the PDFs to see the professional formatting")
    print("   - Compare reports with and without AI analysis")
    print("   - Use these as templates for your own investigations")
    
    if not use_ai:
        print("\n🔑 To enable AI analysis:")
        print("   1. Get NVIDIA API key: https://build.nvidia.com/")
        print("   2. Set environment variable: export NVIDIA_API_KEY='your-key'")
        print("   3. Run demo again for AI-enhanced reports")

def demo_chat_simulation():
    """Simulate a chat conversation and generate PDF"""
    
    print("\n=== Chat Conversation Simulation ===\n")
    
    # Simulate chat messages
    chat_messages = [
        {'sender': 'assistant', 'content': 'Hello! I\'m the Murder Investigation Agent. What is the Case ID for this investigation?', 'timestamp': '2023-10-15T10:00:00Z'},
        {'sender': 'user', 'content': '001', 'timestamp': '2023-10-15T10:00:30Z'},
        {'sender': 'assistant', 'content': 'Thank you. When did the crime occur?', 'timestamp': '2023-10-15T10:00:31Z'},
        {'sender': 'user', 'content': '2023-10-15', 'timestamp': '2023-10-15T10:01:00Z'},
        {'sender': 'assistant', 'content': 'What time did the crime occur?', 'timestamp': '2023-10-15T10:01:01Z'},
        {'sender': 'user', 'content': '23:30', 'timestamp': '2023-10-15T10:01:30Z'},
        {'sender': 'assistant', 'content': 'Where did the crime take place?', 'timestamp': '2023-10-15T10:01:31Z'},
        {'sender': 'user', 'content': '789 Elm Street, Apartment 3C', 'timestamp': '2023-10-15T10:02:00Z'},
        {'sender': 'assistant', 'content': 'What is the victim\'s name?', 'timestamp': '2023-10-15T10:02:01Z'},
        {'sender': 'user', 'content': 'Robert Johnson', 'timestamp': '2023-10-15T10:02:30Z'},
        {'sender': 'assistant', 'content': 'What is the victim\'s age?', 'timestamp': '2023-10-15T10:02:31Z'},
        {'sender': 'user', 'content': '42', 'timestamp': '2023-10-15T10:03:00Z'},
        {'sender': 'assistant', 'content': 'What was the cause of death?', 'timestamp': '2023-10-15T10:03:01Z'},
        {'sender': 'user', 'content': 'Multiple stab wounds to the chest', 'timestamp': '2023-10-15T10:03:30Z'},
        {'sender': 'user', 'content': 'Additional notes: Victim recently changed his will, removing ex-wife as beneficiary', 'timestamp': '2023-10-15T10:04:00Z'}
    ]
    
    print("💬 Simulated chat conversation:")
    for msg in chat_messages[-6:]:  # Show last 6 messages
        sender_icon = "🤖" if msg['sender'] == 'assistant' else "👤"
        print(f"   {sender_icon} {msg['sender']}: {msg['content']}")
    
    print(f"\n📊 Extracting data from {len(chat_messages)} messages...")
    
    try:
        # Import extraction function
        import sys
        sys.path.append('.')
        from unified_server import extract_data_from_chat_messages
        
        # Extract data
        extracted_data = extract_data_from_chat_messages(chat_messages)
        
        print("✅ Data extraction successful:")
        for key, value in extracted_data.items():
            if not key.startswith('message_') and not key.startswith('conversation_'):
                print(f"   {key}: {value}")
        
        # Generate PDF from chat data
        nvidia_api_key = os.getenv('NVIDIA_API_KEY', 'dummy-key')
        pdf_generator = DynamicPDFGenerator(nvidia_api_key)
        
        pdf_buffer = pdf_generator.generate_pdf(
            data=extracted_data,
            title='Murder Investigation - Chat-Based Report',
            analysis_type='murder',
            include_ai_analysis=bool(os.getenv('NVIDIA_API_KEY'))
        )
        
        # Save PDF
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"demo_chat_conversation_{timestamp}.pdf"
        
        with open(filename, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        file_size = len(pdf_buffer.getvalue())
        print(f"\n📄 Chat-based PDF generated: {filename} ({file_size:,} bytes)")
        
    except Exception as e:
        print(f"❌ Error in chat simulation: {str(e)}")

if __name__ == "__main__":
    # Run the main demo
    demo_nvidia_pdf()
    
    # Run chat simulation
    demo_chat_simulation()
    
    print(f"\n🎉 Demo completed! Check the generated PDF files.")
    print(f"💡 These PDFs demonstrate the full capabilities of the system:")
    print(f"   - Professional formatting and layout")
    print(f"   - Structured data presentation")
    print(f"   - AI-powered analysis (if API key provided)")
    print(f"   - Chat conversation data extraction")
