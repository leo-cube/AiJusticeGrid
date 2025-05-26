#!/usr/bin/env python3
"""
Test script for PDF generation functionality.
"""

import requests
import json
import sys
import os

def test_pdf_generation():
    """Test the PDF generation endpoint."""
    
    # Sample incident data
    test_incident = {
        "id": "TEST-001",
        "date": "2025-01-16",
        "time": "14:30",
        "location": "Test Location",
        "incident_type": "Test Investigation",
        "description": "This is a test incident for PDF generation functionality.",
        "reporting_officer": "Test Officer",
        "evidence": "Test evidence collected",
        "status": "Completed",
        "victims": [
            {
                "name": "Test Victim",
                "age": 30,
                "gender": "Unknown",
                "injuries": "None"
            }
        ],
        "suspects": [
            {
                "name": "Test Suspect",
                "age": 25,
                "gender": "Unknown",
                "description": "Test description"
            }
        ],
        "ai_analysis": "This is a test AI analysis for the PDF generation system. The analysis includes various details about the incident and provides insights based on the available data."
    }
    
    # Test the PDF generation endpoint
    try:
        print("Testing PDF generation...")
        
        # Try the main server first
        url = "http://localhost:5000/api/generate-pdf"
        response = requests.post(url, json=test_incident, timeout=10)
        
        if response.status_code == 200:
            # Save the PDF file
            filename = f"test_report_{test_incident['id']}.pdf"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ PDF generated successfully: {filename}")
            print(f"  File size: {len(response.content)} bytes")
            return True
        else:
            print(f"✗ PDF generation failed: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server at localhost:5000")
        print("  Make sure the Python backend server is running")
        
    except Exception as e:
        print(f"✗ Error testing PDF generation: {str(e)}")
    
    # Try the test server
    try:
        print("\nTrying test server...")
        url = "http://localhost:5001/api/generate-pdf"
        response = requests.post(url, json=test_incident, timeout=10)
        
        if response.status_code == 200:
            # Save the PDF file
            filename = f"test_report_simple_{test_incident['id']}.pdf"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ PDF generated successfully with test server: {filename}")
            print(f"  File size: {len(response.content)} bytes")
            return True
        else:
            print(f"✗ PDF generation failed on test server: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to test server at localhost:5001")
        print("  You can start the test server with: python pdf_test_server.py")
        
    except Exception as e:
        print(f"✗ Error testing PDF generation with test server: {str(e)}")
    
    return False

def test_server_connection():
    """Test if the servers are running."""
    
    servers = [
        ("Main server", "http://localhost:5000"),
        ("Test server", "http://localhost:5001")
    ]
    
    for name, url in servers:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✓ {name} is running at {url}")
            else:
                print(f"✗ {name} returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"✗ {name} is not running at {url}")
        except Exception as e:
            print(f"✗ Error connecting to {name}: {str(e)}")

if __name__ == "__main__":
    print("PDF Generation Test Script")
    print("=" * 40)
    
    print("\n1. Testing server connections...")
    test_server_connection()
    
    print("\n2. Testing PDF generation...")
    success = test_pdf_generation()
    
    if success:
        print("\n✓ PDF generation test completed successfully!")
        print("Check the generated PDF file(s) in the current directory.")
    else:
        print("\n✗ PDF generation test failed.")
        print("Make sure at least one of the servers is running:")
        print("  - Main server: python unified_server.py")
        print("  - Test server: python pdf_test_server.py")
    
    print("\nTest completed.")
