import { NextRequest, NextResponse } from 'next/server';

/**
 * Test route for PDF generation - always uses client-side generation
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Test PDF generation started...');
    
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    
    console.log('jsPDF imported successfully');
    
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Test PDF Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Add metadata
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 10;
    doc.text('Status: PDF generation working correctly', margin, yPos);
    yPos += 10;
    doc.text('This is a test PDF to verify client-side generation.', margin, yPos);

    // Add footer
    const footerText = `Test Report - Generated on ${new Date().toLocaleDateString()}`;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    const filename = `test_report_${Date.now()}.pdf`;
    
    console.log('Test PDF generated successfully');
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error generating test PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate test PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test PDF endpoint - use POST to generate a test PDF' 
  });
}
