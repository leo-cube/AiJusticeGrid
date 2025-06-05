#!/usr/bin/env python3
"""
Dynamic PDF Generator with NVIDIA AI Integration
Generates PDF reports from user data with AI-powered analysis using NVIDIA API.
"""

import os
import json
import logging
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, Optional, List
import requests

# PDF generation libraries
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
    from reportlab.platypus.flowables import HRFlowable
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("ReportLab not available. Install with: pip install reportlab")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DynamicPDFGenerator:
    """
    Dynamic PDF Generator that creates professional reports from user data
    with AI-powered analysis using NVIDIA API.
    """

    def __init__(self, nvidia_api_key: str):
        """
        Initialize the PDF generator with NVIDIA API key.

        Args:
            nvidia_api_key: NVIDIA API key for AI analysis
        """
        self.nvidia_api_key = nvidia_api_key
        self.base_url = "https://integrate.api.nvidia.com/v1"

        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is required for PDF generation. Install with: pip install reportlab")

    def call_nvidia_api(self, prompt: str, system_prompt: str, max_tokens: int = 2048) -> str:
        """
        Call NVIDIA API to generate AI analysis.

        Args:
            prompt: User prompt for analysis
            system_prompt: System prompt defining AI behavior
            max_tokens: Maximum tokens for response

        Returns:
            AI-generated analysis text
        """
        try:
            logger.info("Calling NVIDIA API for analysis...")

            headers = {
                "Authorization": f"Bearer {self.nvidia_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "top_p": 0.95,
                "max_tokens": max_tokens,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }

            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                logger.error(f"NVIDIA API error: {response.status_code} - {response.text}")
                return f"Error generating AI analysis: {response.status_code}"

        except Exception as e:
            logger.error(f"Error calling NVIDIA API: {str(e)}")
            return f"Error generating AI analysis: {str(e)}"

    def create_styles(self):
        """Create custom styles for the PDF."""
        styles = getSampleStyleSheet()

        # Custom styles
        custom_styles = {
            'title': ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=20,
                spaceAfter=30,
                spaceBefore=20,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#1a365d'),
                fontName='Helvetica-Bold'
            ),
            'heading': ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=15,
                spaceBefore=20,
                textColor=colors.HexColor('#2d3748'),
                fontName='Helvetica-Bold'
            ),
            'subheading': ParagraphStyle(
                'CustomSubHeading',
                parent=styles['Heading3'],
                fontSize=14,
                spaceAfter=10,
                spaceBefore=15,
                textColor=colors.HexColor('#4a5568'),
                fontName='Helvetica-Bold'
            ),
            'normal': ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=11,
                spaceAfter=8,
                spaceBefore=4,
                alignment=TA_JUSTIFY,
                fontName='Helvetica'
            ),
            'highlight': ParagraphStyle(
                'CustomHighlight',
                parent=styles['Normal'],
                fontSize=11,
                spaceAfter=8,
                spaceBefore=4,
                alignment=TA_LEFT,
                fontName='Helvetica',
                backColor=colors.HexColor('#f7fafc'),
                borderColor=colors.HexColor('#e2e8f0'),
                borderWidth=1,
                borderPadding=8
            ),
            'footer': ParagraphStyle(
                'CustomFooter',
                parent=styles['Normal'],
                fontSize=9,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#718096'),
                fontName='Helvetica-Oblique'
            )
        }

        return custom_styles

    def format_user_data(self, data: Dict[str, Any]) -> str:
        """
        Format user data into a structured prompt for AI analysis.

        Args:
            data: Dictionary containing user data

        Returns:
            Formatted prompt string
        """
        prompt = "Please analyze the following data and provide comprehensive insights:\n\n"

        # Add data fields
        for key, value in data.items():
            if value and str(value).strip():
                formatted_key = key.replace('_', ' ').title()
                prompt += f"{formatted_key}: {value}\n"

        prompt += "\n\nPlease provide:\n"
        prompt += "1. A comprehensive analysis of the provided information\n"
        prompt += "2. Key insights and patterns identified\n"
        prompt += "3. Recommendations or next steps\n"
        prompt += "4. Any potential risks or considerations\n"
        prompt += "5. Summary and conclusions\n"

        return prompt

    def generate_ai_analysis(self, user_data: Dict[str, Any], analysis_type: str = "general") -> str:
        """
        Generate AI analysis based on user data and analysis type.

        Args:
            user_data: Dictionary containing user data
            analysis_type: Type of analysis (general, investigation, business, etc.)

        Returns:
            AI-generated analysis
        """
        # Define system prompts for different analysis types
        system_prompts = {
            "general": "You are an expert analyst. Provide detailed, professional analysis of the provided data with actionable insights and recommendations.",
            "investigation": "You are a professional investigator and analyst. Analyze the provided case data and provide detailed investigative insights, potential leads, and recommended actions.",
            "business": "You are a business analyst and consultant. Analyze the provided business data and provide strategic insights, recommendations, and risk assessments.",
            "financial": """You are a Financial Fraud Investigation Agent. Analyze the provided financial fraud case data and provide a comprehensive analysis in the following exact format:

**Comprehensive Analysis: Case ID [case_id] - [fraud_type]**

### 1. **Case Assessment:**
- **Fraud Type:** [Type of financial fraud]
- **Severity:** [High/Medium/Low based on amount and complexity]
- **Overview:** [Brief summary of the fraud case]

### 2. **Fraud Methodology:**
- **Likely Execution:** [How the fraud was likely carried out]
- **Technical Analysis:** [Technical aspects of the fraud method]
- **Vulnerability Exploited:** [What security gaps were exploited]

### 3. **Evidence Analysis:**
- **Available Evidence:** [Analysis of collected evidence]
- **Evaluation:** [Strength and reliability of evidence]
- **Potential Gaps:** [What additional evidence is needed]

### 4. **Investigative Approach:**
- **Immediate Steps:** [Priority actions for investigators]
- **In-Depth Investigation:** [Detailed investigative strategy]
- **Technical Analysis:** [Forensic and technical analysis needed]

### 5. **Recovery Strategy:**
- **Fund Recovery:** [Strategies for asset recovery]
- **Damage Mitigation:** [Steps to minimize ongoing damage]

### 6. **Prevention Measures:**
- **Short-Term:** [Immediate security improvements]
- **Long-Term:** [Systemic improvements and controls]

### 7. **Legal Considerations:**
- **Reporting Requirements:** [Regulatory and legal obligations]
- **Relevant Laws:** [Applicable laws and regulations]

**Actionable Insights Summary:**
- **Urgency:** [Critical/High/Medium/Low based on ongoing risk]
- **Resource Allocation:** [Recommended investigation resources]
- **Stakeholder Communication:** [Key parties to notify and coordinate with]

Provide detailed, evidence-based analysis using financial forensics principles and fraud investigation best practices.""",
            "legal": "You are a legal analyst. Analyze the provided information from a legal perspective and provide insights on legal implications, risks, and recommendations.",
            "medical": "You are a medical analyst. Analyze the provided medical data and provide professional medical insights and recommendations.",
            "technical": "You are a technical analyst. Analyze the provided technical data and provide detailed technical insights, assessments, and recommendations.",
            "murder": """You are a Murder Investigation Agent. Analyze the provided case data and provide a comprehensive analysis in the following exact format:

**Comprehensive Analysis of Case [CASE_ID]**

**1. Comprehensive Analysis of the Case**
[Provide detailed analysis of the murder case, including timeline, circumstances, and key facts]

**2. Potential Motives and Suspects to Consider**
[List each suspect with their motives and opportunities in bullet format]

**3. Recommended Investigative Approaches**
[Provide specific investigative steps including interviews, forensic analysis, and crime scene reconstruction]

**4. Key Evidence to Focus On and How to Analyze It**
[Detail each piece of evidence and how it should be analyzed]

**5. Possible Solutions or Conclusions**
[Provide conclusions about the most likely suspects and next steps]

Use bullet points with bold headers where appropriate. Be thorough and professional.""",
            "theft": "You are a Theft Investigation Agent. Analyze the provided case data and provide detailed investigative insights, potential recovery methods, and recommended actions.",
            "fraud": "You are a Financial Fraud Investigation Agent. Analyze the provided case data and provide detailed fraud analysis, risk assessments, and recommended investigative actions."
        }

        system_prompt = system_prompts.get(analysis_type, system_prompts["general"])
        user_prompt = self.format_user_data(user_data)

        return self.call_nvidia_api(user_prompt, system_prompt)

    def generate_investigation_pdf(self, data: Dict[str, Any], analysis_type: str = "general") -> BytesIO:
        """
        Generate a comprehensive PDF report from live chat conversation data.
        Routes to specialized PDF generators based on agent type.

        Args:
            data: Dictionary containing case data and conversation pairs
            analysis_type: Type of analysis to perform

        Returns:
            BytesIO object containing the PDF data
        """
        # Detect agent type and route to appropriate specialized PDF generator
        agent_type = self.detect_agent_type(data)

        try:
            # Use relative imports with proper error handling
            if agent_type == 'financial':
                try:
                    # Use specialized Financial Agent PDF generator
                    from FinancialAgent.financial_pdf_generator import FinancialPDFGenerator
                    financial_generator = FinancialPDFGenerator()
                    return financial_generator.generate_financial_pdf(data)
                except ImportError as e:
                    logger.warning(f"Could not import financial PDF generator: {e}")
                    # Fall back to legacy generation
            
            elif agent_type == 'theft':
                try:
                    # Use specialized Theft Agent PDF generator
                    from TheftAgent.theft_pdf_generator import TheftPDFGenerator
                    theft_generator = TheftPDFGenerator()
                    return theft_generator.generate_theft_pdf(data)
                except ImportError as e:
                    logger.warning(f"Could not import theft PDF generator: {e}")
                    # Fall back to legacy generation
            
            elif agent_type == 'murder':
                try:
                    # Use specialized Murder Agent PDF generator
                    from murder_pdf_generator import MurderPDFGenerator
                    murder_generator = MurderPDFGenerator()
                    return murder_generator.generate_murder_pdf(data)
                except ImportError as e:
                    logger.warning(f"Could not import murder PDF generator: {e}")
                    # Fall back to legacy generation
            
            # Default to legacy generation method
            return self.generate_legacy_pdf(data, analysis_type)

        except Exception as e:
            logger.error(f"Error in PDF generation routing: {e}")
            # Fall back to legacy generation method
            return self.generate_legacy_pdf(data, analysis_type)

    def generate_legacy_pdf(self, data: Dict[str, Any], analysis_type: str = "general") -> BytesIO:
        """
        Legacy PDF generation method - kept for backward compatibility.
        """
        buffer = BytesIO()

        # Create the PDF document with proper margins
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)

        # Get custom styles that match generate_pdf.py format
        styles = self.create_professional_styles()

        # Build the story (content)
        story = []

        # Title
        story.append(Paragraph("INCIDENT INVESTIGATION REPORT", styles['title']))
        story.append(Spacer(1, 20))

        # Header information table - only include data that exists
        header_data = []

        # Only add fields that have actual data from conversation
        if data.get('case_id'):
            header_data.append(['Report ID:', data.get('case_id')])

        header_data.append(['Date Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")])

        # Use appropriate date field based on agent type
        agent_type = self.detect_agent_type(data)
        if agent_type == 'financial':
            if data.get('date_of_incident'):
                header_data.append(['Investigation Date:', data.get('date_of_incident')])
        else:
            if data.get('crime_date'):
                header_data.append(['Investigation Date:', data.get('crime_date')])

        header_data.append(['Status:', 'Under Investigation'])

        # Set appropriate report type based on agent
        if agent_type == 'financial':
            header_data.append(['Report Type:', 'Finance Investigation Report'])
        else:
            header_data.append(['Report Type:', f'{analysis_type.title()} Investigation Report'])

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

        # CASE DETAILS Section
        story.append(Paragraph("CASE DETAILS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))

        # Extract and format case details in table format
        case_details = self.format_case_details_table(data)
        if case_details:
            details_table = Table(case_details, colWidths=[2*inch, 4*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                # Allow text wrapping in cells
                ('WORDWRAP', (0, 0), (-1, -1), True),
                # Set row height to auto-adjust for wrapped text
                ('ROWBACKGROUNDS', (0, 0), (-1, -1), [None, colors.HexColor('#fafafa')]),
            ]))
            story.append(details_table)

        story.append(Spacer(1, 20))

        # INVESTIGATION CONVERSATION Section (if conversation pairs exist)
        if 'conversation_pairs' in data and data['conversation_pairs']:
            story.append(Paragraph("INVESTIGATION CONVERSATION:", styles['section_header']))
            story.append(Paragraph("=" * 50, styles['separator']))
            story.append(Spacer(1, 10))

            # Add conversation flow
            for i, pair in enumerate(data['conversation_pairs'], 1):
                # Question - clean agent names and formatting
                question_text = pair['question'].replace('Murder Agent', '').strip()
                question_text = question_text.replace('Financial Fraud Agent', '').strip()
                question_text = question_text.replace('Finance Agent', '').strip()
                if question_text.startswith('Live Data'):
                    question_text = question_text.replace('Live Data', '').strip()
                if question_text.startswith('Live Data Analysis'):
                    question_text = question_text.replace('Live Data Analysis', '').strip()
                if question_text.startswith('**[LIVE DATA ANALYSIS]**'):
                    question_text = question_text.replace('**[LIVE DATA ANALYSIS]**', '').strip()

                # Clean markdown formatting from question
                clean_question = self.clean_markdown_text(question_text)
                story.append(Paragraph(f"Q{i}: {clean_question}", styles['question']))
                story.append(Spacer(1, 3))

                # Answer - clean markdown formatting
                clean_answer = self.clean_markdown_text(pair['answer'])
                story.append(Paragraph(f"A{i}: {clean_answer}", styles['answer']))
                story.append(Spacer(1, 8))

            story.append(Spacer(1, 15))

        # ANALYSIS Section
        story.append(Paragraph("ANALYSIS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))

        # Generate AI analysis
        try:
            ai_analysis = self.generate_ai_analysis(data, analysis_type)

            # Clean the analysis text to remove markdown formatting
            clean_analysis = self.clean_markdown_text(ai_analysis)

            # Split into paragraphs and add to PDF
            analysis_paragraphs = clean_analysis.split('\n\n')
            for paragraph in analysis_paragraphs:
                paragraph = paragraph.strip()
                if paragraph:
                    # Add each paragraph as clean text
                    story.append(Paragraph(paragraph, styles['analysis_text']))
                    story.append(Spacer(1, 6))

        except Exception as e:
            logger.error(f"Error generating AI analysis: {str(e)}")
            story.append(Paragraph(f"Error generating analysis: {str(e)}", styles['analysis_text']))

        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"Generated by AI Justice Grid Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(footer_text, styles['footer']))

        # Build the PDF
        doc.build(story)
        buffer.seek(0)

        return buffer

    def generate_financial_pdf_legacy(self, data: Dict[str, Any], analysis_type: str = "financial") -> BytesIO:
        """
        Generate a Financial Agent specific PDF report.
        """
        buffer = BytesIO()

        # Create the PDF document with proper margins
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)

        # Get custom styles
        styles = self.create_professional_styles()

        # Build the story (content)
        story = []

        # Financial Agent specific title
        story.append(Paragraph("FINANCIAL FRAUD INVESTIGATION REPORT", styles['title']))
        story.append(Spacer(1, 20))

        # Financial Agent specific header
        header_data = []
        if data.get('case_id'):
            header_data.append(['Case ID:', data.get('case_id')])

        header_data.append(['Date Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")])

        if data.get('date_of_incident'):
            header_data.append(['Investigation Date:', data.get('date_of_incident')])

        header_data.append(['Status:', 'Under Investigation'])
        header_data.append(['Report Type:', 'Financial Fraud Investigation Report'])

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

        # Financial case details section
        story.append(Paragraph("FRAUD CASE DETAILS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))

        # Financial specific case details
        case_details = self.format_financial_case_details(data)
        if case_details:
            details_table = Table(case_details, colWidths=[2*inch, 4*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('WORDWRAP', (0, 0), (-1, -1), True),
            ]))
            story.append(details_table)

        story.append(Spacer(1, 20))

        # Add conversation section if available
        if 'conversation_pairs' in data and data['conversation_pairs']:
            story.append(Paragraph("INVESTIGATION INTERVIEW:", styles['section_header']))
            story.append(Paragraph("=" * 50, styles['separator']))
            story.append(Spacer(1, 10))

            for i, pair in enumerate(data['conversation_pairs'], 1):
                # Clean question text for financial agent
                question_text = pair['question'].replace('Financial Fraud Agent', '').strip()
                question_text = question_text.replace('Finance Agent', '').strip()
                question_text = question_text.replace('**[LIVE DATA ANALYSIS]**', '').strip()

                clean_question = self.clean_markdown_text(question_text)
                story.append(Paragraph(f"Q{i}: {clean_question}", styles['question']))
                story.append(Spacer(1, 3))

                clean_answer = self.clean_markdown_text(pair['answer'])
                story.append(Paragraph(f"A{i}: {clean_answer}", styles['answer']))
                story.append(Spacer(1, 8))

            story.append(Spacer(1, 15))

        # Financial analysis section
        story.append(Paragraph("FINANCIAL FORENSIC ANALYSIS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))

        try:
            ai_analysis = self.generate_ai_analysis(data, "financial")
            clean_analysis = self.clean_markdown_text(ai_analysis)
            analysis_paragraphs = clean_analysis.split('\n\n')
            for paragraph in analysis_paragraphs:
                paragraph = paragraph.strip()
                if paragraph:
                    story.append(Paragraph(paragraph, styles['analysis_text']))
                    story.append(Spacer(1, 6))
        except Exception as e:
            logger.error(f"Error generating financial analysis: {str(e)}")
            story.append(Paragraph(f"Error generating analysis: {str(e)}", styles['analysis_text']))

        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"Generated by Financial Fraud Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(footer_text, styles['footer']))

        # Build the PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_murder_pdf(self, data: Dict[str, Any], analysis_type: str = "murder") -> BytesIO:
        """
        Generate a Murder Agent specific PDF report.
        """
        buffer = BytesIO()

        # Create the PDF document with proper margins
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)

        # Get custom styles
        styles = self.create_professional_styles()

        # Build the story (content)
        story = []

        # Murder Agent specific title
        story.append(Paragraph("HOMICIDE INVESTIGATION REPORT", styles['title']))
        story.append(Spacer(1, 20))

        # Murder Agent specific header
        header_data = []
        if data.get('case_id'):
            header_data.append(['Case ID:', data.get('case_id')])

        header_data.append(['Date Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")])

        if data.get('crime_date') or data.get('date'):
            crime_date = data.get('crime_date') or data.get('date')
            header_data.append(['Investigation Date:', crime_date])

        header_data.append(['Status:', 'Under Investigation'])
        header_data.append(['Report Type:', 'Homicide Investigation Report'])

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

        # Murder case details section
        story.append(Paragraph("CRIME SCENE DETAILS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))

        # Murder specific case details
        case_details = self.format_murder_case_details(data)
        if case_details:
            details_table = Table(case_details, colWidths=[2*inch, 4*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('WORDWRAP', (0, 0), (-1, -1), True),
            ]))
            story.append(details_table)

        story.append(Spacer(1, 20))

        # Add conversation section if available
        if 'conversation_pairs' in data and data['conversation_pairs']:
            story.append(Paragraph("INVESTIGATION INTERVIEW:", styles['section_header']))
            story.append(Paragraph("=" * 50, styles['separator']))
            story.append(Spacer(1, 10))

            for i, pair in enumerate(data['conversation_pairs'], 1):
                # Clean question text for murder agent
                question_text = pair['question'].replace('Murder Agent', '').strip()
                question_text = question_text.replace('**[LIVE DATA ANALYSIS]**', '').strip()
                if question_text.startswith('Live Data'):
                    question_text = question_text.replace('Live Data', '').strip()
                if question_text.startswith('Live Data Analysis'):
                    question_text = question_text.replace('Live Data Analysis', '').strip()

                clean_question = self.clean_markdown_text(question_text)
                story.append(Paragraph(f"Q{i}: {clean_question}", styles['question']))
                story.append(Spacer(1, 3))

                clean_answer = self.clean_markdown_text(pair['answer'])
                story.append(Paragraph(f"A{i}: {clean_answer}", styles['answer']))
                story.append(Spacer(1, 8))

            story.append(Spacer(1, 15))

        # Murder analysis section
        story.append(Paragraph("FORENSIC ANALYSIS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))

        try:
            ai_analysis = self.generate_ai_analysis(data, "murder")
            clean_analysis = self.clean_markdown_text(ai_analysis)
            analysis_paragraphs = clean_analysis.split('\n\n')
            for paragraph in analysis_paragraphs:
                paragraph = paragraph.strip()
                if paragraph:
                    story.append(Paragraph(paragraph, styles['analysis_text']))
                    story.append(Spacer(1, 6))
        except Exception as e:
            logger.error(f"Error generating murder analysis: {str(e)}")
            story.append(Paragraph(f"Error generating analysis: {str(e)}", styles['analysis_text']))

        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"Generated by Homicide Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(footer_text, styles['footer']))

        # Build the PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def create_professional_styles(self):
        """Create professional styles that match generate_pdf.py format."""
        styles = getSampleStyleSheet()

        custom_styles = {
            'title': ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#003366'),
                fontName='Helvetica-Bold'
            ),
            'section_header': ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=12,
                spaceBefore=20,
                textColor=colors.HexColor('#003366'),
                fontName='Helvetica-Bold'
            ),
            'separator': ParagraphStyle(
                'Separator',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Courier',
                spaceAfter=6,
                spaceBefore=0,
                alignment=TA_LEFT
            ),
            'case_detail': ParagraphStyle(
                'CaseDetail',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Helvetica',
                spaceAfter=3,
                spaceBefore=0,
                alignment=TA_LEFT
            ),
            'question': ParagraphStyle(
                'Question',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Helvetica-Bold',
                spaceAfter=3,
                spaceBefore=0,
                alignment=TA_LEFT,
                textColor=colors.HexColor('#1a365d')
            ),
            'answer': ParagraphStyle(
                'Answer',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Helvetica',
                spaceAfter=6,
                spaceBefore=0,
                alignment=TA_LEFT,
                leftIndent=15,
                textColor=colors.HexColor('#2d3748')
            ),
            'analysis_header': ParagraphStyle(
                'AnalysisHeader',
                parent=styles['Normal'],
                fontSize=11,
                fontName='Helvetica-Bold',
                spaceAfter=8,
                spaceBefore=12,
                alignment=TA_LEFT
            ),
            'analysis_text': ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=11,
                spaceAfter=6,
                alignment=TA_JUSTIFY,
                fontName='Helvetica'
            ),
            'bullet_point': ParagraphStyle(
                'BulletPoint',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Helvetica',
                spaceAfter=4,
                spaceBefore=0,
                alignment=TA_LEFT,
                leftIndent=20
            ),
            'footer': ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                alignment=TA_CENTER,
                textColor=colors.grey,
                fontName='Helvetica'
            )
        }

        return custom_styles

    def create_investigation_styles(self):
        """Create styles that match the sample case analysis format."""
        return self.create_professional_styles()

    def clean_markdown_text(self, text: str) -> str:
        """
        Clean markdown formatting from text to produce plain text output.

        Args:
            text: Text that may contain markdown formatting

        Returns:
            Clean plain text without markdown formatting
        """
        if not text:
            return ""

        # Convert to string and strip
        clean_text = str(text).strip()

        # Remove markdown formatting characters
        clean_text = clean_text.replace('**', '')  # Bold markers
        clean_text = clean_text.replace('*', '')   # Italic markers
        clean_text = clean_text.replace('__', '')  # Alternative bold
        clean_text = clean_text.replace('_', '')   # Alternative italic

        # Remove header markers
        clean_text = clean_text.replace('###', '')
        clean_text = clean_text.replace('##', '')
        clean_text = clean_text.replace('#', '')

        # Clean bullet points and list markers
        clean_text = clean_text.replace('- ', '')
        clean_text = clean_text.replace('+ ', '')
        clean_text = clean_text.replace('* ', '')

        # Remove extra whitespace and normalize
        clean_text = ' '.join(clean_text.split())

        return clean_text

    def validate_data_value(self, value: Any) -> bool:
        """
        Validate that a data value is real user-provided content, not placeholder.

        Args:
            value: The value to validate

        Returns:
            True if the value is valid user content, False otherwise
        """
        if not value:
            return False

        str_value = str(value).strip().lower()

        # Reject common placeholder values
        invalid_values = {
            'unknown', 'not specified', 'not provided', 'n/a', 'na', 'none',
            'null', 'undefined', 'empty', 'no data', 'no information',
            'not available', 'tbd', 'to be determined', 'pending'
        }

        if str_value in invalid_values:
            return False

        # Reject very short values that are likely not meaningful
        if len(str_value) < 2:
            return False

        return True

    def detect_agent_type(self, data: Dict[str, Any]) -> str:
        """
        Detect the agent type based on the data fields present.

        Args:
            data: Dictionary containing case data

        Returns:
            String indicating agent type ('financial', 'murder', 'theft', etc.)
        """
        # Check conversation pairs for agent type indicators first
        if 'conversation_pairs' in data:
            for pair in data['conversation_pairs']:
                question = pair.get('question', '').lower()

                # Financial agent indicators
                if any(keyword in question for keyword in [
                    'financial fraud', 'fraud agent', 'financial institution',
                    'account number', 'wire fraud', 'credit card fraud',
                    'amount involved', 'financial amount'
                ]):
                    return 'financial'

                # Theft agent indicators
                if any(keyword in question for keyword in [
                    'theft agent', 'stolen items', 'theft investigation',
                    'burglary', 'robbery', 'item value', 'entry method'
                ]):
                    return 'theft'

                # Murder agent indicators
                if any(keyword in question for keyword in [
                    'murder agent', 'homicide', 'victim name', 'cause of death',
                    'weapon used', 'crime scene', 'body found'
                ]):
                    return 'murder'

        # Check for Financial Agent specific fields
        financial_fields = ['financial_institution', 'fraud_type', 'amount_involved', 'account_type', 'account_number']
        if any(field in data for field in financial_fields):
            return 'financial'

        # Check for Theft Agent specific fields
        theft_fields = ['stolen_items', 'item_value', 'theft_method', 'entry_method', 'theft_date']
        if any(field in data for field in theft_fields):
            return 'theft'

        # Check for Murder Agent specific fields
        murder_fields = ['cause_of_death', 'weapon_used', 'crime_scene']
        if any(field in data for field in murder_fields):
            return 'murder'

        # Default to murder agent format for backward compatibility
        return 'murder'

    def wrap_long_text(self, text: str, max_length: int = 80) -> str:
        """
        Wrap long text to prevent table overflow in PDF.

        Args:
            text: Text to wrap
            max_length: Maximum length per line

        Returns:
            Text with line breaks for better formatting
        """
        if len(text) <= max_length:
            return text

        words = text.split()
        lines = []
        current_line = []
        current_length = 0

        for word in words:
            if current_length + len(word) + 1 <= max_length:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = len(word)

        if current_line:
            lines.append(' '.join(current_line))

        return '\n'.join(lines)

    def format_financial_case_details(self, data: Dict[str, Any]) -> List[List[str]]:
        """
        Format financial case details specifically for Financial Agent PDFs.
        """
        details = []

        # Financial Agent specific field mapping (no location field)
        field_mapping = [
            ('case_id', 'Case ID:'),
            ('date_of_incident', 'Date of Incident:'),
            ('time_of_discovery', 'Time of Discovery:'),
            ('financial_institution', 'Financial Institution:'),
            ('victim_name', 'Victim Name:'),
            ('account_type', 'Account Type:'),
            ('account_number', 'Account Number:'),
            ('fraud_type', 'Type of Fraud:'),
            ('amount_involved', 'Amount Involved:'),
            ('method_used', 'Method Used:'),
            ('suspicious_activity', 'Suspicious Activity:'),
            ('evidence_collected', 'Evidence Collected:'),
            ('suspects', 'Suspects:'),
            ('additional_notes', 'Additional Notes:')
        ]

        # Process each field in order - only include validated data
        for data_key, display_name in field_mapping:
            if (data_key in data and self.validate_data_value(data[data_key])):
                value = self.clean_markdown_text(str(data[data_key]))

                # Handle evidence fields with proper text wrapping
                if 'evidence' in data_key.lower() and len(value) > 100:
                    value = self.wrap_long_text(value, max_length=80)

                details.append([display_name, value])
                logger.info(f"Added financial field to PDF: {display_name} = {value[:50]}{'...' if len(value) > 50 else ''}")

        return details

    def format_murder_case_details(self, data: Dict[str, Any]) -> List[List[str]]:
        """
        Format murder case details specifically for Murder Agent PDFs.
        """
        details = []

        # Murder Agent specific field mapping (includes location)
        field_mapping = [
            ('case_id', 'Case ID:'),
            ('crime_date', 'Date of Incident:'),
            ('date', 'Date of Incident:'),
            ('crime_time', 'Time of Incident:'),
            ('time', 'Time of Incident:'),
            ('location', 'Location:'),
            ('victim_name', 'Victim Name:'),
            ('name', 'Victim Name:'),
            ('victim_age', 'Victim Age:'),
            ('age', 'Victim Age:'),
            ('victim_gender', 'Victim Gender:'),
            ('gender', 'Victim Gender:'),
            ('cause_of_death', 'Cause of Death:'),
            ('weapon_used', 'Weapon Used:'),
            ('weapon', 'Weapon Used:'),
            ('crime_scene_description', 'Crime Scene:'),
            ('crime_scene', 'Crime Scene:'),
            ('witnesses', 'Witnesses:'),
            ('evidence_found', 'Evidence:'),
            ('evidence', 'Evidence:'),
            ('suspects', 'Suspects:'),
            ('additional_notes', 'Additional Notes:'),
            ('notes', 'Additional Notes:')
        ]

        # Track processed keys to avoid duplicates
        processed_keys = set()

        # Process each field in order - only include validated data
        for data_key, display_name in field_mapping:
            if (data_key in data and
                data_key not in processed_keys and
                self.validate_data_value(data[data_key])):

                value = self.clean_markdown_text(str(data[data_key]))

                # Handle evidence fields with proper text wrapping
                if 'evidence' in data_key.lower() and len(value) > 100:
                    value = self.wrap_long_text(value, max_length=80)

                details.append([display_name, value])
                processed_keys.add(data_key)
                logger.info(f"Added murder field to PDF: {display_name} = {value[:50]}{'...' if len(value) > 50 else ''}")

        return details

    def format_case_details_table(self, data: Dict[str, Any]) -> List[List[str]]:
        """
        Format case details as table data for professional PDF layout.
        Only includes actual user-provided data, no placeholders or hardcoded values.
        """
        details = []

        # Detect agent type from data to use appropriate field mapping
        agent_type = self.detect_agent_type(data)

        if agent_type == 'financial':
            # Financial Agent specific field mapping (no location field)
            field_mapping = [
                ('case_id', 'Case ID:'),
                ('date_of_incident', 'Date of Incident:'),
                ('time_of_discovery', 'Time of Discovery:'),
                ('financial_institution', 'Financial Institution:'),
                ('victim_name', 'Victim Name:'),
                ('account_type', 'Account Type:'),
                ('account_number', 'Account Number:'),
                ('fraud_type', 'Type of Fraud:'),
                ('amount_involved', 'Amount Involved:'),
                ('method_used', 'Method Used:'),
                ('suspicious_activity', 'Suspicious Activity:'),
                ('evidence_collected', 'Evidence Collected:'),
                ('suspects', 'Suspects:'),
                ('additional_notes', 'Additional Notes:')
            ]
        else:
            # Default/Murder Agent field mapping
            field_mapping = [
                ('case_id', 'Case ID:'),
                ('crime_date', 'Date of Incident:'),
                ('date', 'Date of Incident:'),
                ('crime_time', 'Time of Incident:'),
                ('time', 'Time of Incident:'),
                ('location', 'Location:'),
                ('victim_name', 'Victim Name:'),
                ('name', 'Victim Name:'),
                ('victim_age', 'Victim Age:'),
                ('age', 'Victim Age:'),
                ('victim_gender', 'Victim Gender:'),
                ('gender', 'Victim Gender:'),
                ('cause_of_death', 'Cause of Death:'),
                ('weapon_used', 'Weapon Used:'),
                ('weapon', 'Weapon Used:'),
                ('crime_scene_description', 'Crime Scene:'),
                ('crime_scene', 'Crime Scene:'),
                ('witnesses', 'Witnesses:'),
                ('evidence_found', 'Evidence:'),
                ('evidence', 'Evidence:'),
                ('suspects', 'Suspects:'),
                ('additional_notes', 'Additional Notes:'),
                ('notes', 'Additional Notes:')
            ]

        # Track processed keys to avoid duplicates
        processed_keys = set()

        # Process each field in order - only include validated data
        for data_key, display_name in field_mapping:
            if (data_key in data and
                data_key not in processed_keys and
                self.validate_data_value(data[data_key])):

                value = self.clean_markdown_text(str(data[data_key]))

                # Handle evidence fields with proper text wrapping
                if 'evidence' in data_key.lower() and len(value) > 100:
                    # Split long evidence text into multiple lines for better table formatting
                    value = self.wrap_long_text(value, max_length=80)

                details.append([display_name, value])
                processed_keys.add(data_key)
                logger.info(f"Added field to PDF: {display_name} = {value[:50]}{'...' if len(value) > 50 else ''}")

        # Add any other relevant fields not in the mapping - only validated data
        excluded_prefixes = ['message_', 'total_', 'user_', 'assistant_', 'conversation_']
        excluded_keys = {'requestId', 'sessionId', 'timestamp', 'conversation_start', 'conversation_end', 'userId', 'userid'}

        # For financial agent, also exclude location field if it appears in additional fields
        if agent_type == 'financial':
            excluded_keys.add('location')

        for key, value in data.items():
            if (key not in processed_keys and
                not any(key.startswith(prefix) for prefix in excluded_prefixes) and
                key not in excluded_keys and
                self.validate_data_value(value)):

                formatted_key = key.replace('_', ' ').title() + ':'
                clean_value = self.clean_markdown_text(str(value))

                # Handle evidence fields with proper text wrapping for additional fields too
                if 'evidence' in key.lower() and len(clean_value) > 100:
                    clean_value = self.wrap_long_text(clean_value, max_length=80)

                details.append([formatted_key, clean_value])
                logger.info(f"Added additional field to PDF: {formatted_key} = {clean_value[:50]}{'...' if len(clean_value) > 50 else ''}")

        logger.info(f"Total fields added to PDF: {len(details)}")
        return details

    def format_case_details(self, data: Dict[str, Any]) -> List[str]:
        """Format case details in the exact format of the sample (for backward compatibility)."""
        details = []

        # Define the exact field mapping and formatting
        field_mapping = {
            'case_id': 'Case Id',
            'date': 'Date Of Crime',
            'time': 'Time Of Crime',
            'location': 'Location',
            'name': 'Victim Name',
            'victim_name': 'Victim Name',
            'age': 'Victim Age',
            'victim_age': 'Victim Age',
            'victim_gender': 'Victim Gender',
            'gender': 'Victim Gender',
            'cause_of_death': 'Cause Of Death',
            'weapon_used': 'Weapon Used',
            'weapon': 'Weapon Used',
            'crime_scene_description': 'Crime Scene Description',
            'crime_scene': 'Crime Scene Description',
            'witnesses': 'Witnesses',
            'evidence_found': 'Evidence Found',
            'evidence': 'Evidence Found',
            'suspects': 'Suspects',
            'additional_notes': 'Additional Notes',
            'notes': 'Additional Notes'
        }

        # Process each field in order
        for data_key, display_name in field_mapping.items():
            if data_key in data and data[data_key] and str(data[data_key]).strip():
                value = str(data[data_key]).strip()
                details.append(f"{display_name}: {value}")

        # Add any other relevant fields not in the mapping
        processed_keys = set(field_mapping.keys())
        processed_keys.update(['message_', 'total_', 'user_', 'assistant_', 'conversation_', 'requestId', 'sessionId'])

        for key, value in data.items():
            if (key not in processed_keys and
                not any(key.startswith(prefix) for prefix in ['message_', 'total_', 'user_', 'assistant_', 'conversation_']) and
                value and str(value).strip()):
                formatted_key = key.replace('_', ' ').title()
                details.append(f"{formatted_key}: {str(value).strip()}")

        return details

    def optimize_image_for_pdf(self, image_data, max_size=(800, 800)):
        """Optimize images to reduce PDF size and memory usage."""
        try:
            from PIL import Image
            import io
            
            # Open the image from bytes
            img = Image.open(io.BytesIO(image_data))
            
            # Resize if needed
            if img.width > max_size[0] or img.height > max_size[1]:
                img.thumbnail(max_size)
            
            # Convert to RGB if RGBA
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            
            # Save optimized image
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            return output.getvalue()
        except Exception as e:
            logger.warning(f"Image optimization failed: {e}")
            return image_data
