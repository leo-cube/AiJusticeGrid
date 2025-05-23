"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable */
var pdfGenerator_1 = require("./utils/pdfGenerator");
// Create a sample report for testing
var sampleReport = {
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
    analysis: "\n# Crime Scene Analysis\n\nThe disarrayed room and broken window suggest forced entry and a potential struggle. The evidence indicates that the victim likely knew the attacker and may have resisted. The time of death aligns with the witness report of screams at 3:00 AM, providing a crucial timeline reference for the investigation.\n\n# Weapon Analysis\n\nThe rope used for strangulation appears to be the murder weapon. There is potential for DNA/fingerprint evidence on the rope. The nature of the weapon may suggest a crime of passion or opportunity, rather than a premeditated act with a conventional weapon.\n\n# Victim Background\n\nThe victim was planning to move to a new city for a job opportunity. She had recently filed a restraining order, indicating fear of harm from a specific individual. This context provides important motivational factors to consider in the investigation.\n\n# Recommendations for Further Investigation\n\n1. Interview Witnesses \u2013 Especially the upstairs neighbor and any individuals in proximity during the time of crime.\n2. Interrogate Suspects \u2013 Especially the ex-boyfriend and coworker, focusing on motive, alibi, and recent behavior.\n3. Forensic Testing \u2013 Submit rope, phone, boot print, and broken glass for DNA/fingerprint analysis.\n4. Digital Forensics \u2013 Examine phone records, messages, emails, and social media interactions.\n5. Timeline Creation \u2013 Reconstruct victim's last 48 hours in detail.\n6. Background Checks \u2013 On all suspects for prior threats, violence, or stalking behavior.\n\n# Motive Assessment\n\nEx-boyfriend: Possible revenge or emotional trigger due to restraining order and upcoming relocation.\nCoworker: Potential motive rooted in romantic rejection and unreciprocated interest.\n\nAdditional motives to explore include:\n- Financial gain\n- Emotional grievance\n- Attempt to prevent victim from leaving or testifying\n\n# Conclusion\n\nThe evidence suggests a personal and premeditated attack, likely by someone close to the victim. The crime scene points to a struggle and the use of a rope indicates manual planning or impulsive rage. Given the presence of digital threats, known suspects with motive, and physical evidence, this case should be prioritized for immediate forensic analysis and suspect interrogation.\n  "
};
// Generate and download the PDF
var doc = (0, pdfGenerator_1.generateInvestigationReportPDF)(sampleReport);
(0, pdfGenerator_1.downloadPDF)(doc, 'test-murder-report.pdf');
console.log('PDF generated and downloaded successfully!');
