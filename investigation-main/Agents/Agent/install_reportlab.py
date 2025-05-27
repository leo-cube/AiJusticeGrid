#!/usr/bin/env python3
"""
Script to install ReportLab library
"""

import subprocess
import sys

def install_reportlab():
    """Install ReportLab using pip"""
    try:
        print("Installing ReportLab...")
        result = subprocess.run([sys.executable, "-m", "pip", "install", "reportlab==4.0.4"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("ReportLab installed successfully!")
            print(result.stdout)
        else:
            print("Failed to install ReportLab:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error installing ReportLab: {e}")
        return False

def test_import():
    """Test if ReportLab can be imported"""
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
        print("ReportLab import successful!")
        return True
    except ImportError as e:
        print(f"ReportLab import failed: {e}")
        return False

if __name__ == "__main__":
    print("Python executable:", sys.executable)
    print("Python version:", sys.version)
    
    # Test if ReportLab is already installed
    if test_import():
        print("ReportLab is already installed and working!")
    else:
        print("ReportLab not found, attempting to install...")
        if install_reportlab():
            print("Installation completed, testing import...")
            test_import()
        else:
            print("Installation failed")
