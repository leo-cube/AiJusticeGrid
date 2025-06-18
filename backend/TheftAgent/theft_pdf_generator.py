"""
Theft Agent PDF Generator
Specialized PDF generation for Theft Investigation Reports.
"""

import os
import logging
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, List
import requests

# PDF generation libraries
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TheftPDFGenerator:
    """
    Specialized PDF generator for Theft Investigation Reports.
    """
    
    def __init__(self):
        """Initialize the Theft PDF Generator."""
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is required for PDF generation. Install with: pip install reportlab")
        
        # Load environment variables for NVIDIA API
        self.api_key = os.getenv("NVIDIA_API_KEY")
        if not self.api_key:
            logger.warning("NVIDIA_API_KEY not found. AI analysis will be disabled.")
    
    def generate_theft_pdf(self, data: Dict[str, Any]) -> BytesIO:
        """
        Generate a Theft Investigation PDF report.
        
        Args:
            data: Dictionary containing theft case data and conversation pairs
            
        Returns:
            BytesIO object containing the PDF data
        """
        buffer = BytesIO()
        
        # Create the PDF document with proper margins
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)
        
        # Get custom styles
        styles = self.create_theft_styles()
        
        # Build the story (content)
        story = []
        
        # Theft Agent specific title
        story.append(Paragraph("THEFT INVESTIGATION REPORT", styles['title']))
        story.append(Spacer(1, 20))
        
        # Theft Agent specific header
        header_data = []
        if data.get('case_id'):
            header_data.append(['Case ID:', data.get('case_id')])
        
        header_data.append(['Date Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
        
        if data.get('theft_date') or data.get('date'):
            theft_date = data.get('theft_date') or data.get('date')
            header_data.append(['Investigation Date:', theft_date])
        
        header_data.append(['Status:', 'Under Investigation'])
        header_data.append(['Report Type:', 'Theft Investigation Report'])
        
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
        
        # Theft case details section
        story.append(Paragraph("THEFT INCIDENT DETAILS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))
        
        # Theft specific case details
        case_details = self.format_theft_case_details(data)
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
                # Clean question text for theft agent
                question_text = pair['question'].replace('Theft Agent', '').strip()
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
        
        # Theft analysis section
        story.append(Paragraph("THEFT ANALYSIS:", styles['section_header']))
        story.append(Paragraph("=" * 50, styles['separator']))
        story.append(Spacer(1, 10))
        
        try:
            ai_analysis = self.generate_theft_analysis(data)
            clean_analysis = self.clean_markdown_text(ai_analysis)
            analysis_paragraphs = clean_analysis.split('\n\n')
            for paragraph in analysis_paragraphs:
                paragraph = paragraph.strip()
                if paragraph:
                    story.append(Paragraph(paragraph, styles['analysis_text']))
                    story.append(Spacer(1, 6))
        except Exception as e:
            logger.error(f"Error generating theft analysis: {str(e)}")
            story.append(Paragraph(f"Error generating analysis: {str(e)}", styles['analysis_text']))
        
        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"Generated by Theft Investigation System - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(footer_text, styles['footer']))
        
        # Build the PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def format_theft_case_details(self, data: Dict[str, Any]) -> List[List[str]]:
        """
        Format theft case details specifically for Theft Agent PDFs.
        INCLUDES LOCATION FIELD.
        """
        details = []
        
        # Theft Agent specific field mapping (includes location)
        field_mapping = [
            ('case_id', 'Case ID:'),
            ('theft_date', 'Date of Incident:'),
            ('date', 'Date of Incident:'),
            ('theft_time', 'Time of Incident:'),
            ('time', 'Time of Incident:'),
            ('location', 'Location:'),
            ('victim_name', 'Victim Name:'),
            ('name', 'Victim Name:'),
            ('stolen_items', 'Stolen Items:'),
            ('item_value', 'Estimated Value:'),
            ('theft_method', 'Method of Theft:'),
            ('entry_method', 'Entry Method:'),
            ('security_measures', 'Security Measures:'),
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
                logger.info(f"Added theft field to PDF: {display_name} = {value[:50]}{'...' if len(value) > 50 else ''}")
        
        return details
    
    def validate_data_value(self, value) -> bool:
        """
        Validate that a data value is real user-provided content, not placeholder.
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
    
    def clean_markdown_text(self, text: str) -> str:
        """
        Clean markdown formatting from text to produce plain text output.
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
    
    def wrap_long_text(self, text: str, max_length: int = 80) -> str:
        """
        Wrap long text to prevent table overflow in PDF.
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

    def create_theft_styles(self):
        """Create professional styles for Theft Agent PDFs."""
        styles = getSampleStyleSheet()

        custom_styles = {
            'title': ParagraphStyle(
                'TheftTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#4a5568'),
                fontName='Helvetica-Bold'
            ),
            'section_header': ParagraphStyle(
                'TheftHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=12,
                spaceBefore=20,
                textColor=colors.HexColor('#4a5568'),
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
            'question': ParagraphStyle(
                'Question',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Helvetica-Bold',
                spaceAfter=3,
                spaceBefore=0,
                alignment=TA_LEFT,
                textColor=colors.HexColor('#2d3748')
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
            'analysis_text': ParagraphStyle(
                'AnalysisText',
                parent=styles['Normal'],
                fontSize=11,
                spaceAfter=6,
                alignment=TA_JUSTIFY,
                fontName='Helvetica'
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

    def generate_theft_analysis(self, data: Dict[str, Any]) -> str:
        """
        Generate AI-powered theft investigation analysis.
        """
        if not self.api_key:
            return "AI analysis unavailable - NVIDIA API key not configured."

        # Theft investigation analysis prompt
        system_prompt = """You are a Theft Investigation Agent. Analyze the provided theft case data and provide a comprehensive analysis in the following exact format:

**Comprehensive Analysis: Case ID [case_id] - Theft Investigation**

### 1. **Case Assessment:**
- **Theft Type:** [Type of theft - burglary, shoplifting, vehicle theft, etc.]
- **Severity:** [High/Medium/Low based on value and circumstances]
- **Overview:** [Brief summary of the theft case]

### 2. **Modus Operandi Analysis:**
- **Entry Method:** [How the perpetrator gained access]
- **Theft Method:** [How the theft was executed]
- **Target Selection:** [Why these items/location were chosen]

### 3. **Evidence Analysis:**
- **Physical Evidence:** [Analysis of collected physical evidence]
- **Digital Evidence:** [Security footage, electronic records]
- **Witness Testimony:** [Analysis of witness statements]

### 4. **Investigative Approach:**
- **Immediate Steps:** [Priority actions for investigators]
- **Follow-up Investigation:** [Detailed investigative strategy]
- **Recovery Efforts:** [Strategies for item recovery]

### 5. **Suspect Profile:**
- **Likely Characteristics:** [Profile of potential perpetrator]
- **Pattern Analysis:** [Similar cases or repeat offender indicators]
- **Opportunity Assessment:** [Who had access and opportunity]

### 6. **Recovery and Prevention:**
- **Recovery Strategy:** [Steps to recover stolen items]
- **Prevention Measures:** [How to prevent similar thefts]
- **Security Recommendations:** [Improved security measures]

**Actionable Insights Summary:**
- **Priority Level:** [Urgent/High/Medium/Low]
- **Recovery Potential:** [High/Medium/Low likelihood of recovery]
- **Investigation Focus:** [Key areas to concentrate efforts]

Provide detailed, evidence-based analysis using theft investigation best practices."""

        user_prompt = self.format_user_data(data)

        return self.call_nvidia_api(user_prompt, system_prompt)

    def format_user_data(self, data: Dict[str, Any]) -> str:
        """Format user data for AI analysis."""
        formatted_data = []

        for key, value in data.items():
            if key not in ['conversation_pairs', 'total_messages', 'user_messages', 'assistant_messages']:
                if self.validate_data_value(value):
                    formatted_data.append(f"{key.replace('_', ' ').title()}: {value}")

        return "\n".join(formatted_data)

    def call_nvidia_api(self, user_prompt: str, system_prompt: str) -> str:
        """Call NVIDIA API for AI analysis."""
        try:
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }

            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            result = response.json()
            return result['choices'][0]['message']['content']

        except Exception as e:
            logger.error(f"Error calling NVIDIA API: {str(e)}")
            return f"Error generating AI analysis: {str(e)}"
