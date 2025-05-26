#!/usr/bin/env python3
"""
Simple PDF generator using only built-in Python libraries.
This creates a basic PDF without external dependencies.
"""

import json
import datetime
import os

def create_html_report(incident_data):
    """Create an HTML report that can be converted to PDF."""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Incident Report - {incident_data.get('id', 'Unknown')}</title>
    <style>
        body {{ 
            font-family: Arial, sans-serif;
            margin: 2cm;
            line-height: 1.6;
            color: #333;
        }}
        .header {{
            text-align: center;
            border-bottom: 3px solid #003366;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        h1 {{ 
            color: #003366;
            font-size: 24px;
            margin: 0;
        }}
        h2 {{
            color: #003366;
            font-size: 18px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-top: 25px;
        }}
        .info-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: white;
        }}
        .info-table th, .info-table td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        .info-table th {{
            background-color: #f8f9fa;
            font-weight: bold;
            color: #003366;
        }}
        .info-table tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        .status-badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
            font-size: 14px;
        }}
        .status-completed, .status-closed, .status-resolved {{
            background-color: #28a745;
        }}
        .status-open {{
            background-color: #ffc107;
            color: #212529;
        }}
        .status-under-investigation {{
            background-color: #17a2b8;
        }}
        .status-pending-trial {{
            background-color: #dc3545;
        }}
        .footer {{
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }}
        .section {{
            margin-bottom: 25px;
        }}
        .person-card {{
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
        }}
        .person-title {{
            font-weight: bold;
            color: #003366;
            margin-bottom: 10px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>INCIDENT INVESTIGATION REPORT</h1>
        <p><strong>Report ID:</strong> {incident_data.get('id', 'Unknown')}</p>
        <p><strong>Generated:</strong> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>

    <div class="section">
        <h2>Incident Details</h2>
        <table class="info-table">
            <tr><th>Field</th><th>Value</th></tr>
            <tr><td>Date of Incident</td><td>{incident_data.get('date', 'Unknown')}</td></tr>
            <tr><td>Time of Incident</td><td>{incident_data.get('time', 'Unknown')}</td></tr>
            <tr><td>Location</td><td>{incident_data.get('location', 'Unknown')}</td></tr>
            <tr><td>Incident Type</td><td>{incident_data.get('incident_type', 'Unknown')}</td></tr>
            <tr><td>Reporting Officer</td><td>{incident_data.get('reporting_officer', 'Unknown')}</td></tr>
            <tr><td>Evidence</td><td>{incident_data.get('evidence', 'Unknown')}</td></tr>
            <tr><td>Status</td><td><span class="status-badge status-{incident_data.get('status', '').lower().replace(' ', '-')}">{incident_data.get('status', 'Unknown')}</span></td></tr>
        </table>
    </div>
"""

    # Add victims section if available
    if 'victims' in incident_data and incident_data['victims']:
        html_content += """
    <div class="section">
        <h2>Victims</h2>
"""
        for i, victim in enumerate(incident_data['victims']):
            html_content += f"""
        <div class="person-card">
            <div class="person-title">Victim {i+1}</div>
            <table class="info-table">
                <tr><td><strong>Name</strong></td><td>{victim.get('name', 'Unknown')}</td></tr>
                <tr><td><strong>Age</strong></td><td>{victim.get('age', 'Unknown')}</td></tr>
                <tr><td><strong>Gender</strong></td><td>{victim.get('gender', 'Unknown')}</td></tr>
                <tr><td><strong>Injuries</strong></td><td>{victim.get('injuries', 'Unknown')}</td></tr>
            </table>
        </div>
"""
        html_content += "    </div>"

    # Add suspects section if available
    if 'suspects' in incident_data and incident_data['suspects']:
        html_content += """
    <div class="section">
        <h2>Suspects</h2>
"""
        for i, suspect in enumerate(incident_data['suspects']):
            html_content += f"""
        <div class="person-card">
            <div class="person-title">Suspect {i+1}</div>
            <table class="info-table">
                <tr><td><strong>Name</strong></td><td>{suspect.get('name', 'Unknown')}</td></tr>
                <tr><td><strong>Age</strong></td><td>{suspect.get('age', 'Unknown')}</td></tr>
                <tr><td><strong>Gender</strong></td><td>{suspect.get('gender', 'Unknown')}</td></tr>
                <tr><td><strong>Description</strong></td><td>{suspect.get('description', 'Unknown')}</td></tr>
            </table>
        </div>
"""
        html_content += "    </div>"

    # Add description and AI analysis
    if 'description' in incident_data and incident_data['description']:
        html_content += f"""
    <div class="section">
        <h2>Incident Description</h2>
        <p>{incident_data['description']}</p>
    </div>
"""

    if 'ai_analysis' in incident_data and incident_data['ai_analysis']:
        html_content += f"""
    <div class="section">
        <h2>AI Analysis</h2>
        <p>{incident_data['ai_analysis']}</p>
    </div>
"""

    html_content += f"""
    <div class="footer">
        <p><strong>Generated by AI Justice Grid Investigation System</strong></p>
        <p>{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
</body>
</html>
"""
    
    return html_content

def generate_sample_reports():
    """Generate sample reports from the incidents.json file."""
    
    # Load the incidents data
    try:
        with open('Agents/Agent/incidents.json', 'r') as f:
            data = json.load(f)
        incidents = data.get('incidents', [])
    except FileNotFoundError:
        print("incidents.json not found. Creating sample data...")
        incidents = [
            {
                "id": "SAMPLE-001",
                "date": "2025-01-16",
                "time": "14:30",
                "location": "Downtown Office Building",
                "incident_type": "Theft Investigation",
                "description": "A comprehensive investigation into a theft case involving multiple suspects and witnesses. The incident occurred during business hours with several people present.",
                "reporting_officer": "Detective Smith",
                "evidence": "Security camera footage, fingerprints, witness statements",
                "status": "Completed",
                "victims": [
                    {
                        "name": "John Doe",
                        "age": 35,
                        "gender": "Male",
                        "injuries": "None"
                    }
                ],
                "suspects": [
                    {
                        "name": "Jane Smith",
                        "age": 28,
                        "gender": "Female",
                        "description": "Medium height, brown hair, wearing dark clothing"
                    }
                ],
                "ai_analysis": "Based on the evidence collected, this appears to be a premeditated theft. The suspect had knowledge of the building layout and security protocols. The timing suggests inside information was used. Recommend further investigation into employees with access to the affected area."
            }
        ]
    
    # Create output directory
    output_dir = "generated_reports"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Generate HTML reports for each incident
    for incident in incidents[:3]:  # Generate first 3 reports as examples
        html_content = create_html_report(incident)
        
        # Save HTML file
        filename = f"{output_dir}/incident_report_{incident['id']}.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Generated HTML report: {filename}")
    
    print(f"\\nGenerated {min(3, len(incidents))} HTML reports in '{output_dir}' directory")
    print("These HTML files can be opened in a browser and printed to PDF using the browser's print function.")
    
    return output_dir

if __name__ == "__main__":
    print("Simple PDF Report Generator")
    print("=" * 40)
    
    output_dir = generate_sample_reports()
    
    print(f"\\nTo convert to PDF:")
    print("1. Open the HTML files in a web browser")
    print("2. Use the browser's Print function (Ctrl+P)")
    print("3. Select 'Save as PDF' as the destination")
    print("4. The PDF will have professional formatting with tables and styling")
