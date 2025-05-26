#!/usr/bin/env node
/**
 * Generate sample HTML reports that can be converted to PDF
 */

const fs = require('fs');
const path = require('path');

function createHtmlReport(incidentData) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Incident Report - ${incidentData.id}</title>
    <style>
        body { 
            font-family: Arial, sans-serif;
            margin: 2cm;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #003366;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 { 
            color: #003366;
            font-size: 24px;
            margin: 0;
        }
        h2 {
            color: #003366;
            font-size: 18px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-top: 25px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: white;
        }
        .info-table th, .info-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .info-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #003366;
        }
        .info-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
            font-size: 14px;
        }
        .status-completed, .status-closed, .status-resolved {
            background-color: #28a745;
        }
        .status-open {
            background-color: #ffc107;
            color: #212529;
        }
        .status-under-investigation {
            background-color: #17a2b8;
        }
        .status-pending-trial {
            background-color: #dc3545;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
        .section {
            margin-bottom: 25px;
        }
        .person-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
        }
        .person-title {
            font-weight: bold;
            color: #003366;
            margin-bottom: 10px;
        }
        @media print {
            body { margin: 1cm; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>INCIDENT INVESTIGATION REPORT</h1>
        <p><strong>Report ID:</strong> ${incidentData.id}</p>
        <p><strong>Generated:</strong> ${now}</p>
    </div>

    <div class="section">
        <h2>Incident Details</h2>
        <table class="info-table">
            <tr><th>Field</th><th>Value</th></tr>
            <tr><td>Date of Incident</td><td>${incidentData.date}</td></tr>
            <tr><td>Time of Incident</td><td>${incidentData.time}</td></tr>
            <tr><td>Location</td><td>${incidentData.location}</td></tr>
            <tr><td>Incident Type</td><td>${incidentData.incident_type}</td></tr>
            <tr><td>Reporting Officer</td><td>${incidentData.reporting_officer}</td></tr>
            <tr><td>Evidence</td><td>${incidentData.evidence}</td></tr>
            <tr><td>Status</td><td><span class="status-badge status-${incidentData.status.toLowerCase().replace(/\s+/g, '-')}">${incidentData.status}</span></td></tr>
        </table>
    </div>

    ${incidentData.victims && incidentData.victims.length > 0 ? `
    <div class="section">
        <h2>Victims</h2>
        ${incidentData.victims.map((victim, i) => `
        <div class="person-card">
            <div class="person-title">Victim ${i + 1}</div>
            <table class="info-table">
                <tr><td><strong>Name</strong></td><td>${victim.name}</td></tr>
                <tr><td><strong>Age</strong></td><td>${victim.age}</td></tr>
                <tr><td><strong>Gender</strong></td><td>${victim.gender}</td></tr>
                <tr><td><strong>Injuries</strong></td><td>${victim.injuries}</td></tr>
            </table>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${incidentData.suspects && incidentData.suspects.length > 0 ? `
    <div class="section">
        <h2>Suspects</h2>
        ${incidentData.suspects.map((suspect, i) => `
        <div class="person-card">
            <div class="person-title">Suspect ${i + 1}</div>
            <table class="info-table">
                <tr><td><strong>Name</strong></td><td>${suspect.name}</td></tr>
                <tr><td><strong>Age</strong></td><td>${suspect.age}</td></tr>
                <tr><td><strong>Gender</strong></td><td>${suspect.gender}</td></tr>
                <tr><td><strong>Description</strong></td><td>${suspect.description}</td></tr>
            </table>
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>Incident Description</h2>
        <p>${incidentData.description}</p>
    </div>

    ${incidentData.ai_analysis ? `
    <div class="section">
        <h2>AI Analysis</h2>
        <p>${incidentData.ai_analysis}</p>
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Generated by AI Justice Grid Investigation System</strong></p>
        <p>${now}</p>
    </div>
</body>
</html>`;
}

function generateSampleReports() {
    console.log('Generating sample incident reports...');
    
    // Load incidents data
    let incidents;
    try {
        const data = JSON.parse(fs.readFileSync('Agents/Agent/incidents.json', 'utf8'));
        incidents = data.incidents;
    } catch (error) {
        console.log('Using sample data...');
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
        ];
    }
    
    // Create output directory
    const outputDir = 'generated_reports';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    
    // Generate reports for first 3 incidents
    const reportsToGenerate = incidents.slice(0, 3);
    
    reportsToGenerate.forEach((incident, index) => {
        const htmlContent = createHtmlReport(incident);
        const filename = path.join(outputDir, `incident_report_${incident.id}.html`);
        
        fs.writeFileSync(filename, htmlContent, 'utf8');
        console.log(`✓ Generated: ${filename}`);
    });
    
    console.log(`\nGenerated ${reportsToGenerate.length} HTML reports in '${outputDir}' directory`);
    console.log('\nTo convert to PDF:');
    console.log('1. Open the HTML files in a web browser');
    console.log('2. Use Ctrl+P (or Cmd+P on Mac) to print');
    console.log('3. Select "Save as PDF" as the destination');
    console.log('4. The PDF will have professional formatting');
    
    return outputDir;
}

// Run the generator
if (require.main === module) {
    generateSampleReports();
}

module.exports = { generateSampleReports, createHtmlReport };
