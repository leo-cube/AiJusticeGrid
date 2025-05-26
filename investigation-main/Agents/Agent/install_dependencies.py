#!/usr/bin/env python3
"""
Install and upgrade dependencies for the AI Justice Grid system.
This script helps resolve version compatibility issues.
"""

import subprocess
import sys
import os

def run_command(command):
    """Run a command and return success status."""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ Success: {command}")
        if result.stdout:
            print(f"Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed: {command}")
        print(f"Error: {e.stderr.strip()}")
        return False

def install_dependencies():
    """Install and upgrade dependencies."""
    print("AI Justice Grid - Dependency Installation")
    print("=" * 50)
    
    # Upgrade pip first
    print("\n1. Upgrading pip...")
    run_command(f"{sys.executable} -m pip install --upgrade pip")
    
    # Install/upgrade core dependencies
    print("\n2. Installing core dependencies...")
    dependencies = [
        "flask==2.3.3",
        "flask-cors==4.0.0", 
        "requests==2.31.0",
        "python-dotenv==1.0.0"
    ]
    
    for dep in dependencies:
        run_command(f"{sys.executable} -m pip install {dep}")
    
    # Try to install compatible OpenAI version
    print("\n3. Installing OpenAI library...")
    openai_versions = [
        "openai>=1.12.0",
        "openai==1.12.0",
        "openai==1.10.0",
        "openai==1.8.0"
    ]
    
    for version in openai_versions:
        if run_command(f"{sys.executable} -m pip install {version}"):
            break
        print(f"Trying older version...")
    
    # Install httpx with compatible version
    print("\n4. Installing httpx...")
    httpx_versions = [
        "httpx>=0.24.0",
        "httpx==0.24.1",
        "httpx==0.23.3"
    ]
    
    for version in httpx_versions:
        if run_command(f"{sys.executable} -m pip install {version}"):
            break
    
    # Install ReportLab for PDF generation
    print("\n5. Installing ReportLab...")
    run_command(f"{sys.executable} -m pip install reportlab==4.0.4")
    
    # Check installations
    print("\n6. Checking installations...")
    check_commands = [
        f"{sys.executable} -c 'import flask; print(f\"Flask: {{flask.__version__}}\")'",
        f"{sys.executable} -c 'import openai; print(f\"OpenAI: {{openai.__version__}}\")'",
        f"{sys.executable} -c 'import httpx; print(f\"HTTPX: {{httpx.__version__}}\")'",
        f"{sys.executable} -c 'import reportlab; print(f\"ReportLab: {{reportlab.Version}}\")'",
    ]
    
    for cmd in check_commands:
        run_command(cmd)
    
    print("\n" + "=" * 50)
    print("Dependency installation completed!")
    print("You can now try running: python unified_server.py")

def test_openai_compatibility():
    """Test OpenAI library compatibility."""
    print("\n7. Testing OpenAI compatibility...")
    
    test_script = '''
import sys
try:
    from openai import OpenAI
    print("✓ OpenAI import successful")
    
    # Test basic initialization (without actual API call)
    try:
        client = OpenAI(api_key="test-key", base_url="https://api.openai.com/v1")
        print("✓ OpenAI client initialization successful")
    except Exception as e:
        print(f"✗ OpenAI client initialization failed: {e}")
        
except ImportError as e:
    print(f"✗ OpenAI import failed: {e}")
    sys.exit(1)
'''
    
    try:
        result = subprocess.run([sys.executable, "-c", test_script], 
                              capture_output=True, text=True, timeout=10)
        print(result.stdout)
        if result.stderr:
            print(f"Warnings: {result.stderr}")
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    install_dependencies()
    test_openai_compatibility()
    
    print("\nNext steps:")
    print("1. Try running: python unified_server.py")
    print("2. If you still get errors, try: python test_api_key.py")
    print("3. Check the .env file has the correct NVIDIA_API_KEY")
