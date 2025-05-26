#!/usr/bin/env python3
"""
Generate actual PDF files from incident data using reportlab.
This script creates PDF files directly without requiring a web server.
"""

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("ReportLab not available. Install with: pip install reportlab")

import json
import os
from datetime import datetime

def create_pdf_with_reportlab(incident_data, filename):
    """Create a PDF using ReportLab library."""
    if not REPORTLAB_AVAILABLE:
        return False
    
    # Create the PDF document
    doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#003366')
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#003366')
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    # Build the story (content)
    story = []
    
    # Title
    story.append(Paragraph("INCIDENT INVESTIGATION REPORT", title_style))
    story.append(Spacer(1, 20))
    
    # Header information
    header_data = [
        ['Report ID:', incident_data.get('id', 'Unknown')],
        ['Date Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
        ['Status:', incident_data.get('status', 'Unknown')],
        ['Report Type:', 'AI Generated Investigation Report']
    ]
    
    header_table = Table(header_data, colWidths=[2*inch, 4*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f2f2f2')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # Incident Details Section
    story.append(Paragraph("INCIDENT DETAILS", heading_style))
    
    # Create incident details table with dynamic data
    incident_details = [
        ['Date of Incident:', incident_data.get('date', 'Unknown')],
        ['Time of Incident:', incident_data.get('time', 'Unknown')],
        ['Location:', incident_data.get('location', 'Unknown')],
        ['Incident Type:', incident_data.get('incident_type', 'Unknown')],
        ['Reporting Officer:', incident_data.get('reporting_officer', 'Unknown')],
        ['Evidence:', incident_data.get('evidence', 'Unknown')]
    ]
    
    details_table = Table(incident_details, colWidths=[2*inch, 4*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 20))
    
    # Victims Section
    if 'victims' in incident_data and incident_data['victims']:
        story.append(Paragraph("VICTIMS", heading_style))
        
        for i, victim in enumerate(incident_data['victims']):
            victim_data = [
                [f'Victim {i+1} Name:', victim.get('name', 'Unknown')],
                ['Age:', str(victim.get('age', 'Unknown'))],
                ['Gender:', victim.get('gender', 'Unknown')],
                ['Injuries:', victim.get('injuries', 'Unknown')]
            ]
            
            victim_table = Table(victim_data, colWidths=[2*inch, 4*inch])
            victim_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff3cd')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(victim_table)
            story.append(Spacer(1, 10))
    
    # Suspects Section
    if 'suspects' in incident_data and incident_data['suspects']:
        story.append(Paragraph("SUSPECTS", heading_style))
        
        for i, suspect in enumerate(incident_data['suspects']):
            suspect_data = [
                [f'Suspect {i+1} Name:', suspect.get('name', 'Unknown')],
                ['Age:', str(suspect.get('age', 'Unknown'))],
                ['Gender:', suspect.get('gender', 'Unknown')],
                ['Description:', suspect.get('description', 'Unknown')]
            ]
            
            suspect_table = Table(suspect_data, colWidths=[2*inch, 4*inch])
            suspect_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8d7da')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(suspect_table)
            story.append(Spacer(1, 10))
    
    # Description Section
    if 'description' in incident_data and incident_data['description']:
        story.append(Paragraph("INCIDENT DESCRIPTION", heading_style))
        story.append(Paragraph(incident_data['description'], normal_style))
        story.append(Spacer(1, 15))
    
    # AI Analysis Section (if available)
    if 'ai_analysis' in incident_data and incident_data['ai_analysis']:
        story.append(Paragraph("AI ANALYSIS", heading_style))
        story.append(Paragraph(incident_data['ai_analysis'], normal_style))
        story.append(Spacer(1, 15))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph(f"Generated by AI Justice Grid Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))
    
    # Build the PDF
    doc.build(story)
    return True

def create_sample_pdfs():
    """Create sample PDF files from incident data."""
    
    # Sample incident data
    incidents = [
        {
            "id": "INC-0001",
            "date": "2025-01-16",
            "time": "13:43",
            "location": "Public Transit",
            "incident_type": "Trespassing",
            "description": "Incident reported at 13:43 on 2025-01-16. Witness reported suspicious activity.",
            "reporting_officer": "Susan Thompson",
            "victims": [
                {
                    "name": "Michael Thompson",
                    "age": 73,
                    "gender": "Female",
                    "injuries": "Moderate"
                }
            ],
            "suspects": [
                {
                    "name": "Susan Thompson",
                    "age": 33,
                    "gender": "Non-binary",
                    "description": "Masked individual"
                }
            ],
            "evidence": "Digital records",
            "status": "Closed",
            "ai_analysis": "Based on the evidence collected and witness statements, this trespassing incident appears to involve a masked individual who gained unauthorized access to public transit property. The moderate injuries sustained by the victim suggest a physical altercation occurred. The digital records provide crucial evidence for identifying the suspect."
        },
        {
            "id": "MURDER-001",
            "date": "2025-01-15",
            "time": "23:30",
            "location": "789 Elm Street, Apartment 3C",
            "incident_type": "Homicide Investigation",
            "description": "Victim found deceased in apartment with multiple stab wounds. No signs of forced entry. Kitchen knife found at scene.",
            "reporting_officer": "Detective Sarah Johnson",
            "victims": [
                {
                    "name": "Robert Johnson",
                    "age": 42,
                    "gender": "Male",
                    "injuries": "Multiple stab wounds to chest - Fatal"
                }
            ],
            "suspects": [
                {
                    "name": "Lisa Johnson (Ex-wife)",
                    "age": 38,
                    "gender": "Female",
                    "description": "5'6\", brown hair, last seen wearing dark clothing. History of threats."
                },
                {
                    "name": "David Chen (Business Partner)",
                    "age": 45,
                    "gender": "Male",
                    "description": "5'10\", black hair, glasses. Financial dispute with victim."
                }
            ],
            "evidence": "Bloody knife, fingerprints, victim's phone, text messages, blood spatter analysis",
            "status": "Under Investigation",
            "ai_analysis": "This homicide investigation reveals a crime of passion rather than premeditation. The lack of forced entry suggests the victim knew their attacker. The kitchen knife used as the murder weapon was obtained from the victim's own kitchen. The ex-wife emerges as the primary suspect due to documented threats and recent financial motive (will change). Timeline analysis shows a 45-minute confrontation period, suggesting prolonged argument before violence. Recommend immediate questioning of ex-wife, expedited forensic analysis, and financial audit of business partnership."
        }
    ]
    
    # Create output directory
    output_dir = "generated_reports"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print("Generating PDF reports...")
    
    for incident in incidents:
        filename = os.path.join(output_dir, f"incident_report_{incident['id']}.pdf")
        
        if REPORTLAB_AVAILABLE:
            success = create_pdf_with_reportlab(incident, filename)
            if success:
                print(f"✓ Generated PDF: {filename}")
            else:
                print(f"✗ Failed to generate PDF: {filename}")
        else:
            print(f"✗ Cannot generate PDF {filename} - ReportLab not available")
    
    if REPORTLAB_AVAILABLE:
        print(f"\n✓ Successfully generated {len(incidents)} PDF reports in '{output_dir}' directory")
        print("These are professional-quality PDF files ready for use.")
    else:
        print("\n✗ PDF generation failed - ReportLab library not installed")
        print("Install with: pip install reportlab")

if __name__ == "__main__":
    create_sample_pdfs()
