"""
Murder Agent PDF Generator
Specialized PDF generation for Homicide Investigation Reports.
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

class MurderPDFGenerator:
    """
    Specialized PDF generator for Homicide Investigation Reports.
    """
    
    def __init__(self):
        """Initialize the Murder PDF Generator."""
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is required for PDF generation. Install with: pip install reportlab")
        
        # Load environment variables for NVIDIA API
        self.api_key = os.getenv("NVIDIA_API_KEY")
        if not self.api_key:
            logger.warning("NVIDIA_API_KEY not found. AI analysis will be disabled.")
    
    def generate_murder_pdf(self, data: Dict[str, Any]) -> BytesIO:
        """
        Generate a Homicide Investigation PDF report.

        Args:
            data: Dictionary containing murder case data and conversation pairs

        Returns:
            BytesIO object containing the PDF data
        """
        buffer = BytesIO()

        try:
            # Create the PDF document with proper margins
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                                   topMargin=72, bottomMargin=18)

            # Get custom styles
            styles = self.create_murder_styles()

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

            # Add header table
            if header_data:
                header_table = Table(header_data, colWidths=[1.5*inch, 5*inch])
                header_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                story.append(header_table)
                story.append(Spacer(1, 15))

            # Add case details section
            case_details = self.format_murder_case_details(data)
            if case_details:
                story.append(Paragraph("CASE DETAILS", styles['section_header']))
                story.append(Spacer(1, 10))

                # Create case details table
                case_table = Table(case_details, colWidths=[2*inch, 4.5*inch])
                case_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                story.append(case_table)
                story.append(Spacer(1, 20))

            # Add conversation section if available
            if 'conversation_pairs' in data and data['conversation_pairs']:
                story.append(Paragraph("INVESTIGATION INTERVIEW", styles['section_header']))
                story.append(Spacer(1, 10))

                for i, pair in enumerate(data['conversation_pairs'], 1):
                    # Clean question text for murder agent
                    question_text = pair['question'].replace('Murder Agent', '').strip()
                    question_text = question_text.replace('**[LIVE DATA ANALYSIS]**', '').strip()
                    if question_text.startswith('Live Data'):
                        question_text = question_text.replace('Live Data', '').strip()
                    if question_text.startswith('Live Data Analysis'):
                        question_text = question_text.replace('Live Data Analysis', '').strip()

                    # Remove any remaining markdown formatting
                    question_text = self.clean_markdown_text(question_text)

                    if question_text:
                        story.append(Paragraph(f"Q{i}: {question_text}", styles['question']))
                        story.append(Paragraph(f"A{i}: {self.clean_markdown_text(pair['answer'])}", styles['answer']))
                        story.append(Spacer(1, 8))

                story.append(Spacer(1, 15))

            # Add analysis section - look for analysis in the conversation or generate one
            analysis_text = self.extract_or_generate_analysis(data)
            if analysis_text:
                story.append(Paragraph("COMPREHENSIVE CASE ANALYSIS", styles['section_header']))
                story.append(Spacer(1, 10))

                # Split analysis into paragraphs and format properly
                analysis_paragraphs = self.format_analysis_text(analysis_text, styles)
                for paragraph in analysis_paragraphs:
                    story.append(paragraph)
                    story.append(Spacer(1, 6))

                story.append(Spacer(1, 15))

            # Add footer
            story.append(Spacer(1, 20))
            story.append(Paragraph("--- End of Report ---", styles['footer']))

            # Build the PDF
            doc.build(story)
            buffer.seek(0)

            # Validate PDF integrity
            if buffer.getbuffer().nbytes < 100:  # If PDF is too small, it's likely corrupted
                logger.error("Generated PDF is too small, likely corrupted")
                # Create a simple error PDF instead
                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=A4)
                story = [Paragraph("Error: PDF generation failed. Please try again.", styles['title'])]
                doc.build(story)
                buffer.seek(0)

            return buffer
            
        except Exception as e:
            logger.error(f"Error in murder PDF generation: {str(e)}")
            # Create a simple error PDF
            buffer = BytesIO()
            try:
                doc = SimpleDocTemplate(buffer, pagesize=A4)
                styles = getSampleStyleSheet()
                story = [Paragraph(f"Error generating PDF: {str(e)}", styles['Title'])]
                doc.build(story)
            except:
                # If even the error PDF fails, return a text message
                buffer.write(f"Error generating PDF: {str(e)}".encode('utf-8'))
            buffer.seek(0)
            return buffer
    
    def format_murder_case_details(self, data: Dict[str, Any]) -> List[List[str]]:
        """
        Format murder case details specifically for Murder Agent PDFs.
        INCLUDES LOCATION FIELD.
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

    def extract_or_generate_analysis(self, data: Dict[str, Any]) -> str:
        """
        Extract analysis from conversation or generate new analysis.
        """
        # First, try to find existing analysis in the conversation
        if 'conversation_pairs' in data and data['conversation_pairs']:
            for pair in data['conversation_pairs']:
                answer = pair.get('answer', '')
                # Look for comprehensive analysis patterns
                if ('**Case Analysis:' in answer or
                    '**1. Comprehensive Analysis' in answer or
                    'Comprehensive Analysis of the Case' in answer or
                    'CASE ANALYSIS' in answer.upper()):
                    logger.info("Found existing analysis in conversation")
                    return answer

        # If no analysis found in conversation, try to generate one
        logger.info("No existing analysis found, generating new analysis")
        return self.generate_murder_analysis(data)

    def format_analysis_text(self, analysis_text: str, styles) -> List:
        """
        Format analysis text into properly styled paragraphs for PDF.
        """
        paragraphs = []

        # Split by double newlines to get paragraphs
        sections = analysis_text.split('\n\n')

        for section in sections:
            section = section.strip()
            if not section:
                continue

            # Check if this is a header (starts with ** or #)
            if section.startswith('**') and section.endswith('**'):
                # This is a header
                header_text = section.replace('**', '').strip()
                paragraphs.append(Paragraph(header_text, styles['section_header']))
            elif section.startswith('#'):
                # This is also a header
                header_text = section.replace('#', '').strip()
                paragraphs.append(Paragraph(header_text, styles['section_header']))
            else:
                # This is regular text, clean it and add as analysis text
                clean_text = self.clean_markdown_text(section)
                if clean_text:
                    paragraphs.append(Paragraph(clean_text, styles['analysis_text']))

        return paragraphs

    def create_murder_styles(self):
        """Create professional styles for Murder Agent PDFs."""
        styles = getSampleStyleSheet()

        custom_styles = {
            'title': ParagraphStyle(
                'MurderTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#8b0000'),
                fontName='Helvetica-Bold'
            ),
            'section_header': ParagraphStyle(
                'MurderHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=12,
                spaceBefore=20,
                textColor=colors.HexColor('#8b0000'),
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
                textColor=colors.HexColor('#a0522d')
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

    def generate_murder_analysis(self, data: Dict[str, Any]) -> str:
        """
        Generate AI-powered murder investigation analysis.
        """
        if not self.api_key:
            return "AI analysis unavailable - NVIDIA API key not configured."

        # Murder investigation analysis prompt
        system_prompt = """You are a Murder Investigation Agent. Analyze the provided case data and provide a comprehensive analysis in the following exact format:

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

Use bullet points with bold headers where appropriate. Be thorough and professional."""

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
        """Call NVIDIA API for AI analysis with improved timeout handling."""
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

            # Increased timeout for Render's environment
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()

            result = response.json()
            return result['choices'][0]['message']['content']

        except requests.exceptions.Timeout:
            logger.error("NVIDIA API request timed out")
            return "Analysis generation timed out. The server may be experiencing high load. Please try again later."
        except requests.exceptions.RequestException as e:
            logger.error(f"NVIDIA API request error: {str(e)}")
            return f"Error connecting to analysis service: {str(e)}"
        except Exception as e:
            logger.error(f"Error calling NVIDIA API: {str(e)}")
            return f"Error generating AI analysis: {str(e)}"
