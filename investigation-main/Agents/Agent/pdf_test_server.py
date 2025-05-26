#!/usr/bin/env python3
"""
Simple Flask server to test PDF generation functionality.
This is a standalone server for testing the PDF generation feature.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import logging
from datetime import datetime
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def generate_simple_pdf(incident_data):
    """
    Generate a simple PDF report using basic HTML to PDF conversion.
    This is a fallback method that doesn't require reportlab.
    """
    try:
        # Try to use weasyprint if available
        from weasyprint import HTML, CSS
        
        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Incident Report</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif;
                    margin: 2cm;
                    line-height: 1.5;
                }}
                h1 {{ 
                    color: #003366;
                    border-bottom: 2px solid #003366;
                    padding-bottom: 10px;
                    text-align: center;
                }}
                h2 {{
                    color: #003366;
                    margin-top: 20px;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                }}
                .info-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }}
                .info-table th, .info-table td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }}
                .info-table th {{
                    background-color: #f2f2f2;
                    font-weight: bold;
                }}
                .status-badge {{
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-weight: bold;
                    color: white;
                    background-color: #27ae60;
                }}
                .footer {{
                    margin-top: 50px;
                    text-align: center;
                    font-size: 0.8em;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <h1>INCIDENT INVESTIGATION REPORT</h1>
            
            <table class="info-table">
                <tr><th>Report ID</th><td>{incident_data.get('id', 'Unknown')}</td></tr>
                <tr><th>Date Generated</th><td>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td></tr>
                <tr><th>Status</th><td><span class="status-badge">{incident_data.get('status', 'Unknown')}</span></td></tr>
            </table>
            
            <h2>Incident Details</h2>
            <table class="info-table">
                <tr><th>Date of Incident</th><td>{incident_data.get('date', 'Unknown')}</td></tr>
                <tr><th>Time of Incident</th><td>{incident_data.get('time', 'Unknown')}</td></tr>
                <tr><th>Location</th><td>{incident_data.get('location', 'Unknown')}</td></tr>
                <tr><th>Incident Type</th><td>{incident_data.get('incident_type', 'Unknown')}</td></tr>
                <tr><th>Reporting Officer</th><td>{incident_data.get('reporting_officer', 'Unknown')}</td></tr>
                <tr><th>Evidence</th><td>{incident_data.get('evidence', 'Unknown')}</td></tr>
            </table>
        """
        
        # Add victims section if available
        if 'victims' in incident_data and incident_data['victims']:
            html_content += "<h2>Victims</h2>"
            for i, victim in enumerate(incident_data['victims']):
                html_content += f"""
                <table class="info-table">
                    <tr><th>Victim {i+1} Name</th><td>{victim.get('name', 'Unknown')}</td></tr>
                    <tr><th>Age</th><td>{victim.get('age', 'Unknown')}</td></tr>
                    <tr><th>Gender</th><td>{victim.get('gender', 'Unknown')}</td></tr>
                    <tr><th>Injuries</th><td>{victim.get('injuries', 'Unknown')}</td></tr>
                </table>
                """
        
        # Add suspects section if available
        if 'suspects' in incident_data and incident_data['suspects']:
            html_content += "<h2>Suspects</h2>"
            for i, suspect in enumerate(incident_data['suspects']):
                html_content += f"""
                <table class="info-table">
                    <tr><th>Suspect {i+1} Name</th><td>{suspect.get('name', 'Unknown')}</td></tr>
                    <tr><th>Age</th><td>{suspect.get('age', 'Unknown')}</td></tr>
                    <tr><th>Gender</th><td>{suspect.get('gender', 'Unknown')}</td></tr>
                    <tr><th>Description</th><td>{suspect.get('description', 'Unknown')}</td></tr>
                </table>
                """
        
        # Add description and AI analysis
        if 'description' in incident_data:
            html_content += f"<h2>Incident Description</h2><p>{incident_data['description']}</p>"
        
        if 'ai_analysis' in incident_data:
            html_content += f"<h2>AI Analysis</h2><p>{incident_data['ai_analysis']}</p>"
        
        html_content += f"""
            <div class="footer">
                Generated by AI Justice Grid Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </div>
        </body>
        </html>
        """
        
        # Generate PDF
        pdf_buffer = BytesIO()
        HTML(string=html_content).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        return pdf_buffer
        
    except ImportError:
        # Fallback: create a simple text-based "PDF" (actually just a text file)
        logger.warning("weasyprint not available, creating text report instead")
        
        text_content = f"""
INCIDENT INVESTIGATION REPORT
============================

Report ID: {incident_data.get('id', 'Unknown')}
Date Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Status: {incident_data.get('status', 'Unknown')}

INCIDENT DETAILS
================
Date of Incident: {incident_data.get('date', 'Unknown')}
Time of Incident: {incident_data.get('time', 'Unknown')}
Location: {incident_data.get('location', 'Unknown')}
Incident Type: {incident_data.get('incident_type', 'Unknown')}
Reporting Officer: {incident_data.get('reporting_officer', 'Unknown')}
Evidence: {incident_data.get('evidence', 'Unknown')}

"""
        
        if 'victims' in incident_data and incident_data['victims']:
            text_content += "VICTIMS\n=======\n"
            for i, victim in enumerate(incident_data['victims']):
                text_content += f"""
Victim {i+1}:
  Name: {victim.get('name', 'Unknown')}
  Age: {victim.get('age', 'Unknown')}
  Gender: {victim.get('gender', 'Unknown')}
  Injuries: {victim.get('injuries', 'Unknown')}
"""
        
        if 'suspects' in incident_data and incident_data['suspects']:
            text_content += "\nSUSPECTS\n========\n"
            for i, suspect in enumerate(incident_data['suspects']):
                text_content += f"""
Suspect {i+1}:
  Name: {suspect.get('name', 'Unknown')}
  Age: {suspect.get('age', 'Unknown')}
  Gender: {suspect.get('gender', 'Unknown')}
  Description: {suspect.get('description', 'Unknown')}
"""
        
        if 'description' in incident_data:
            text_content += f"\nINCIDENT DESCRIPTION\n===================\n{incident_data['description']}\n"
        
        if 'ai_analysis' in incident_data:
            text_content += f"\nAI ANALYSIS\n===========\n{incident_data['ai_analysis']}\n"
        
        text_content += f"\nGenerated by AI Justice Grid Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        buffer = BytesIO()
        buffer.write(text_content.encode('utf-8'))
        buffer.seek(0)
        return buffer

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """Generate a PDF report from incident data."""
    logger.info("Received request for PDF generation")
    
    try:
        # Get incident data from request
        incident_data = request.json
        if not incident_data:
            return jsonify({
                "success": False,
                "error": "No incident data provided"
            }), 400
        
        # Generate the PDF
        pdf_buffer = generate_simple_pdf(incident_data)
        
        # Create a unique filename
        incident_id = incident_data.get('id', 'unknown')
        filename = f"incident_report_{incident_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # Return the PDF as a file download
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to generate PDF: {str(e)}"
        }), 500

@app.route('/')
def home():
    return jsonify({"message": "PDF Test Server is running"})

@app.route('/test')
def test():
    return jsonify({"message": "Test endpoint working"})

if __name__ == "__main__":
    logger.info("Starting PDF test server on port 5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
