'use client';

import React, { useEffect } from 'react';
import { generateInvestigationReportPDF, downloadPDF } from '@/utils/pdfGenerator';
import { InvestigationReport } from '@/app/types';
import Button from '@/app/components/ui/Button';

// Create a sample report for testing
const sampleReport: InvestigationReport = {
  id: 'INV-TEST-001',
  title: 'Murder Agent Report',
  investigationId: '2023-10-12',
  investigationType: 'Murder Case',
  createdDate: '2023-10-12',
  createdBy: 'Detective Mark Evans',
  status: 'completed',
  questions: [
    {
      question: 'Date of Crime',
      answer: '2023-10-12'
    },
    {
      question: 'Time of Crime',
      answer: '03:15 AM'
    },
    {
      question: 'Location',
      answer: '789 Pine Street, Basement Apartment'
    },
    {
      question: 'Victim Name',
      answer: 'Sarah Johnson'
    },
    {
      question: 'Victim Age',
      answer: '29'
    },
    {
      question: 'Victim Gender',
      answer: 'Female'
    },
    {
      question: 'Cause of Death',
      answer: 'Strangulation'
    },
    {
      question: 'Weapon Used',
      answer: 'Rope'
    },
    {
      question: 'Crime Scene Description',
      answer: 'The victim was found on the bed with signs of struggle evident throughout the room. The room was in disarray, with a window broken from inside, indicating possible forced entry. Screams were heard by the upstairs neighbor around 3:00 AM, which aligns with the estimated time of death.'
    },
    {
      question: 'Witnesses',
      answer: 'Upstairs neighbor reported hearing screams around 3:00 AM'
    },
    {
      question: 'Suspects',
      answer: 'Ex-boyfriend with history of domestic violence, subject of recent restraining order filed by victim. Coworker recently rejected romantically by victim, known to have expressed hostility.'
    }
  ],
  analysis: `
# Crime Scene Analysis

The disarrayed room and broken window suggest forced entry and a potential struggle. The evidence indicates that the victim likely knew the attacker and may have resisted. The time of death aligns with the witness report of screams at 3:00 AM, providing a crucial timeline reference for the investigation.

# Weapon Analysis

The rope used for strangulation appears to be the murder weapon. There is potential for DNA/fingerprint evidence on the rope. The nature of the weapon may suggest a crime of passion or opportunity, rather than a premeditated act with a conventional weapon.

# Victim Background

The victim was planning to move to a new city for a job opportunity. She had recently filed a restraining order, indicating fear of harm from a specific individual. This context provides important motivational factors to consider in the investigation.

# Recommendations for Further Investigation

1. Interview Witnesses – Especially the upstairs neighbor and any individuals in proximity during the time of crime.
2. Interrogate Suspects – Especially the ex-boyfriend and coworker, focusing on motive, alibi, and recent behavior.
3. Forensic Testing – Submit rope, phone, boot print, and broken glass for DNA/fingerprint analysis.
4. Digital Forensics – Examine phone records, messages, emails, and social media interactions.
5. Timeline Creation – Reconstruct victim's last 48 hours in detail.
6. Background Checks – On all suspects for prior threats, violence, or stalking behavior.

# Motive Assessment

Ex-boyfriend: Possible revenge or emotional trigger due to restraining order and upcoming relocation.
Coworker: Potential motive rooted in romantic rejection and unreciprocated interest.

Additional motives to explore include:
- Financial gain
- Emotional grievance
- Attempt to prevent victim from leaving or testifying

# Conclusion

The evidence suggests a personal and premeditated attack, likely by someone close to the victim. The crime scene points to a struggle and the use of a rope indicates manual planning or impulsive rage. Given the presence of digital threats, known suspects with motive, and physical evidence, this case should be prioritized for immediate forensic analysis and suspect interrogation.
  `
};

export default function TestPDFPage() {
  const handleGeneratePDF = () => {
    try {
      console.log('Generating PDF...');
      const doc = generateInvestigationReportPDF(sampleReport);
      downloadPDF(doc, 'test-murder-report.pdf');
      console.log('PDF generated and downloaded successfully!');

      // Show success message to the user
      alert('PDF generated and downloaded successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">PDF Generation Test Page</h1>
      <p className="mb-4">
        This page tests the PDF generation functionality for the Murder Agent Report.
        Click the button below to generate and download a sample PDF report.
      </p>

      <Button onClick={handleGeneratePDF} className="bg-blue-600 hover:bg-blue-700 text-white">
        Generate Test PDF
      </Button>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Sample Report Data</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(sampleReport, null, 2)}
        </pre>
      </div>
    </div>
  );
}
