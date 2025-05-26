#!/usr/bin/env node
/**
 * Create PDF files from HTML using Puppeteer (if available)
 * This script converts the HTML reports to actual PDF files
 */

const fs = require('fs');
const path = require('path');

// Try to use puppeteer if available
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (error) {
    console.log('Puppeteer not available. Install with: npm install puppeteer');
    puppeteer = null;
}

async function convertHtmlToPdf(htmlFile, pdfFile) {
    if (!puppeteer) {
        console.log('Cannot convert to PDF - Puppeteer not available');
        return false;
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Read the HTML file
        const htmlContent = fs.readFileSync(htmlFile, 'utf8');
        
        // Set the content
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        await page.pdf({
            path: pdfFile,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm'
            }
        });
        
        await browser.close();
        return true;
    } catch (error) {
        console.error('Error converting to PDF:', error.message);
        return false;
    }
}

async function createPdfReports() {
    const reportsDir = 'generated_reports';
    
    if (!fs.existsSync(reportsDir)) {
        console.log('Reports directory not found');
        return;
    }
    
    // Find all HTML files
    const htmlFiles = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('.html'))
        .map(file => path.join(reportsDir, file));
    
    if (htmlFiles.length === 0) {
        console.log('No HTML files found to convert');
        return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to convert`);
    
    for (const htmlFile of htmlFiles) {
        const pdfFile = htmlFile.replace('.html', '.pdf');
        console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
        
        const success = await convertHtmlToPdf(htmlFile, pdfFile);
        if (success) {
            console.log(`✓ Created: ${path.basename(pdfFile)}`);
            
            // Get file size
            const stats = fs.statSync(pdfFile);
            console.log(`  File size: ${stats.size} bytes`);
        } else {
            console.log(`✗ Failed to create: ${path.basename(pdfFile)}`);
        }
    }
}

// Alternative method: Create a simple PDF-like document using basic formatting
function createSimplePdfContent(incident) {
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 12 Tf
50 750 Td
(INCIDENT INVESTIGATION REPORT) Tj
0 -20 Td
(Report ID: ${incident.id}) Tj
0 -20 Td
(Date: ${incident.date}) Tj
0 -20 Td
(Location: ${incident.location}) Tj
0 -20 Td
(Type: ${incident.incident_type}) Tj
0 -20 Td
(Status: ${incident.status}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000826 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
901
%%EOF`;
}

function createBasicPdfFiles() {
    console.log('Creating basic PDF files...');
    
    const incidents = [
        {
            id: 'INC-0001',
            date: '2025-01-16',
            location: 'Public Transit',
            incident_type: 'Trespassing',
            status: 'Closed'
        },
        {
            id: 'MURDER-001',
            date: '2025-01-15',
            location: '789 Elm Street, Apartment 3C',
            incident_type: 'Homicide Investigation',
            status: 'Under Investigation'
        }
    ];
    
    const reportsDir = 'generated_reports';
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
    }
    
    incidents.forEach(incident => {
        const filename = path.join(reportsDir, `incident_report_${incident.id}_basic.pdf`);
        const pdfContent = createSimplePdfContent(incident);
        
        fs.writeFileSync(filename, pdfContent, 'binary');
        console.log(`✓ Created basic PDF: ${filename}`);
    });
}

// Main execution
async function main() {
    console.log('PDF Generation Script');
    console.log('====================');
    
    if (puppeteer) {
        console.log('Puppeteer available - converting HTML to PDF...');
        await createPdfReports();
    } else {
        console.log('Puppeteer not available - creating basic PDF files...');
        createBasicPdfFiles();
    }
    
    console.log('\nPDF generation completed!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { convertHtmlToPdf, createPdfReports };
