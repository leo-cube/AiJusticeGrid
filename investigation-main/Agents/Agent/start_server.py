#!/usr/bin/env python3
"""
Simple server startup script to test the Murder Agent backend
"""

import sys
import os
import subprocess
import time

def start_server():
    """Start the unified server"""
    try:
        print("Starting Murder Agent backend server...")
        print(f"Current directory: {os.getcwd()}")
        print(f"Python executable: {sys.executable}")
        
        # Check if unified_server.py exists
        if os.path.exists("unified_server.py"):
            print("✓ unified_server.py found")
        else:
            print("✗ unified_server.py not found")
            return False
        
        # Check if .env file exists
        if os.path.exists(".env"):
            print("✓ .env file found")
        else:
            print("✗ .env file not found")
            return False
        
        # Try to import required modules
        try:
            import flask
            print("✓ Flask available")
        except ImportError:
            print("✗ Flask not available")
            return False
        
        try:
            import openai
            print("✓ OpenAI available")
        except ImportError:
            print("✗ OpenAI not available")
            return False
        
        try:
            import reportlab
            print("✓ ReportLab available")
        except ImportError:
            print("✗ ReportLab not available")
        
        # Start the server
        print("\nStarting server...")
        result = subprocess.run([sys.executable, "unified_server.py"], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✓ Server started successfully")
            print("Output:", result.stdout)
            return True
        else:
            print("✗ Server failed to start")
            print("Error:", result.stderr)
            print("Output:", result.stdout)
            return False
            
    except subprocess.TimeoutExpired:
        print("Server is running (timeout reached)")
        return True
    except Exception as e:
        print(f"Error starting server: {e}")
        return False

if __name__ == "__main__":
    start_server()
