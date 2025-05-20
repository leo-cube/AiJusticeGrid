// Agent utility functions for specialized responses
import { AgentType, ChatContext } from '@/app/types';
import defaultSettings from '@/config/defaultSettings.json';

// Crime Agent responses
export const generateCrimeAgentResponse = (question: string): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Crime location
  if (lowerQuestion.includes('where') || lowerQuestion.includes('location') || lowerQuestion.includes('happen')) {
    return "Based on our crime mapping data, the most recent incidents have been concentrated in the downtown financial district. We've observed a 15% increase in financial crimes in this area over the past month. The most recent incident was reported at 123 Wall Street on May 1st, 2025.";
  }

  // Crime types
  if (lowerQuestion.includes('type') || lowerQuestion.includes('categor')) {
    return "Our analysis shows the following crime categories in the past month:\n\n• Financial Fraud (42%)\n• Cyber Crime (28%)\n• Identity Theft (15%)\n• Physical Robbery (10%)\n• Other (5%)\n\nFinancial fraud remains the most prevalent category, with a significant increase in insider trading cases.";
  }

  // Crime statistics
  if (lowerQuestion.includes('statistic') || lowerQuestion.includes('data') || lowerQuestion.includes('numbers')) {
    return "Crime Statistics (Last 30 Days):\n\n• Total Reported Crimes: 127\n• Open Investigations: 84\n• Closed Cases: 43\n• Success Rate: 33.8%\n• Average Resolution Time: 18.5 days\n• High Severity Cases: 32 (25.2%)\n\nCompared to the previous month, we've seen a 12% increase in total reported crimes.";
  }

  // Suspect information
  if (lowerQuestion.includes('suspect') || lowerQuestion.includes('perpetrator') || lowerQuestion.includes('criminal')) {
    return "Based on our analysis of recent crimes, the primary suspects in the financial district cases appear to be:\n\n• Organized groups with technical expertise (65% of cases)\n• Insider employees (22% of cases)\n• Individual opportunistic actors (13% of cases)\n\nThe suspect profile typically indicates individuals with financial sector knowledge and access to internal systems.";
  }

  // Evidence
  if (lowerQuestion.includes('evidence') || lowerQuestion.includes('proof')) {
    return "The evidence collected in recent cases includes:\n\n• Digital transaction records\n• Surveillance footage from financial institutions\n• Witness testimonies from bank employees\n• Unusual access patterns to secure systems\n• Communication records between suspects\n\nForensic analysis of digital evidence has been particularly valuable in establishing connections between seemingly unrelated cases.";
  }

  // Default response
  return "I'm the Crime Investigation Agent. I can provide information about crime locations, types, statistics, suspects, and evidence. How can I assist with your investigation today?";
};

// Financial Fraud Agent responses
export const generateFinancialFraudAgentResponse = (question: string): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Fraud types
  if (lowerQuestion.includes('type') || lowerQuestion.includes('categor')) {
    return "The financial fraud cases we're currently investigating include:\n\n• Insider Trading (38%)\n• Market Manipulation (27%)\n• Ponzi Schemes (15%)\n• Accounting Fraud (12%)\n• Money Laundering (8%)\n\nInsider trading at XYZ Corp is our highest priority case, with estimated damages of $1.25M.";
  }

  // Stock manipulation
  if (lowerQuestion.includes('stock') && (lowerQuestion.includes('manipulat') || lowerQuestion.includes('fraud'))) {
    return "The following stocks show signs of manipulation:\n\n• XYZ Corp (High Confidence)\n• ABC Tech (High Confidence)\n• DEF Ltd (Medium Confidence)\n\nThese stocks exhibited unusual trading patterns, including:\n• Abnormal trading volumes before major announcements\n• Coordinated buy/sell patterns among related entities\n• Price movements inconsistent with market trends\n\nTrading Group A appears to be connected to multiple suspicious transactions.";
  }

  // Insider trading
  if (lowerQuestion.includes('insider') || lowerQuestion.includes('trading')) {
    return "Our insider trading investigation has identified:\n\n• 5 executives with suspicious trading patterns\n• 3 board members who may have leaked information\n• 12 external traders who acted on non-public information\n\nThe most significant case involves John Smith, who made $750,000 in profits from trades just before the XYZ Corp earnings announcement on May 12th, 2025.";
  }

  // Money laundering
  if (lowerQuestion.includes('money') && lowerQuestion.includes('launder')) {
    return "We've detected a sophisticated money laundering operation involving:\n\n• GHI Holdings as the primary entity\n• 5 shell companies used to layer transactions\n• Approximately $8.5M laundered through the network\n\nThe scheme uses a classic layering technique with multiple transfers between entities to obscure the source of funds. The final destination appears to be offshore accounts in non-cooperative jurisdictions.";
  }

  // Transaction patterns
  if (lowerQuestion.includes('transaction') || lowerQuestion.includes('pattern')) {
    return "Suspicious transaction patterns detected:\n\n• Rapid succession transfers between related entities\n• Round-number transactions ($500,000 exactly)\n• Transactions timed precisely before market announcements\n• Fragmented transactions just below reporting thresholds\n• Unusual trading hours (outside normal market hours)\n\nThese patterns are consistent with sophisticated financial fraud schemes.";
  }

  // Default response
  return "I'm the Financial Fraud Investigation Agent. I can provide information about fraud types, stock manipulation, insider trading, money laundering, and suspicious transaction patterns. How can I assist with your investigation today?";
};

// Exchange Matching Agent responses
export const generateExchangeMatchingAgentResponse = (question: string): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Exchange mismatches
  if (lowerQuestion.includes('mismatch') || lowerQuestion.includes('discrepanc')) {
    return "We've identified several critical exchange mismatches:\n\n• Transaction Volume Discrepancy: Global Exchange A reported $15M while Offshore Exchange B reported only $8M for identical trading pairs\n• Timing Discrepancy: International Exchange C and Regional Exchange D show a consistent 24-hour reporting delay pattern\n• Identity Mismatch: Transactions on Exchange G use corporate entities while matching transactions on Exchange H use individual names\n\nThese discrepancies strongly indicate deliberate reporting manipulation.";
  }

  // Exchange patterns
  if (lowerQuestion.includes('pattern') || lowerQuestion.includes('trend')) {
    return "Exchange matching analysis has revealed these patterns:\n\n• Cross-exchange arbitrage with impossible timing (faster than network latency allows)\n• Coordinated trading across multiple exchanges to manipulate market prices\n• Systematic reporting delays to exploit regulatory gaps\n• Identity switching between exchanges to obscure ownership\n\nThese patterns suggest sophisticated actors with deep understanding of exchange systems and regulatory blind spots.";
  }

  // Suspicious exchanges
  if (lowerQuestion.includes('suspicious') || lowerQuestion.includes('unusual')) {
    return "The most suspicious exchange activities involve:\n\n• Global Exchange A and Offshore Exchange B (92% confidence score)\n• International Exchange G and Local Exchange H (95% confidence score)\n• Crypto Exchange J and Forex Exchange I (88% confidence score)\n\nThese exchange pairs show consistent patterns of misreporting, with discrepancies that cannot be explained by legitimate trading activity or technical errors.";
  }

  // Money movement
  if (lowerQuestion.includes('money') || lowerQuestion.includes('fund') || lowerQuestion.includes('transfer')) {
    return "Our analysis of cross-exchange money movements shows:\n\n• $15M moved through the Global Exchange A → Offshore Exchange B channel with $7M unaccounted for\n• Systematic conversion between fiat and cryptocurrency to break audit trails\n• Funds ultimately flowing to accounts associated with Trading Group X and Offshore Company Y\n\nThe money flow patterns indicate a deliberate attempt to obscure the source and destination of funds.";
  }

  // Recommendations
  if (lowerQuestion.includes('recommend') || lowerQuestion.includes('suggest') || lowerQuestion.includes('action')) {
    return "Based on exchange matching analysis, I recommend:\n\n• Immediate investigation of Global Exchange A and Offshore Exchange B transaction records\n• Freezing accounts associated with Trading Group X pending further investigation\n• Coordinating with international regulators to access Offshore Exchange B records\n• Conducting forensic accounting of all transactions between these exchanges from April-May 2025\n• Interviewing key personnel at Global Exchange A about reporting discrepancies";
  }

  // Default response
  return "I'm the Exchange Matching Investigation Agent. I can provide information about exchange mismatches, suspicious patterns, money movements, and recommended actions. How can I assist with your investigation today?";
};

// General Agent responses (fallback for general questions)
export const generateGeneralAgentResponse = (question: string): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // About the system
  if (lowerQuestion.includes('about') || lowerQuestion.includes('system') || lowerQuestion.includes('what can you do')) {
    return "I'm the Police Investigation System Assistant. I can help with:\n\n• Crime analysis and mapping\n• Financial fraud detection and investigation\n• Exchange matching and discrepancy identification\n• Evidence collection and management\n• Case status tracking and reporting\n\nYou can ask me specific questions about cases, or switch to a specialized agent for deeper domain expertise.";
  }

  // Help
  if (lowerQuestion.includes('help') || lowerQuestion.includes('how to')) {
    return "Here's how to use the Police Investigation System:\n\n• Navigate using the sidebar to access different modules\n• Use the chat interface to ask questions about cases\n• Switch between specialized agents for domain-specific assistance\n• Search for specific cases using the search bar\n• Generate reports from the Reports section\n\nIs there a specific feature you need help with?";
  }

  // Default response
  return "I'm the Police Investigation System Assistant. I can provide general information about investigations, or you can switch to a specialized agent for Crime, Financial Fraud, or Exchange Matching. How can I assist you today?";
};

// Specialized Crime Agent responses

// Theft Agent responses
export const generateTheftAgentResponse = (question: string, context?: ChatContext): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Add case context to the response if available
  const caseContext = context ?
    `\n\nCase Details: ${context.caseId || 'N/A'} | ${context.caseTitle || 'Theft Case'} | Priority: ${context.casePriority || 'Medium'} | Status: ${context.caseStatus || 'Open'}` : '';

  // Theft patterns
  if (lowerQuestion.includes('pattern') || lowerQuestion.includes('trend')) {
    return "Based on our theft pattern analysis, we've identified:\n\n• Most thefts occur between 1-3 AM (68%)\n• Primary targets are electronic devices and cash\n• Entry points are typically unsecured windows (42%) and forced doors (38%)\n• Average theft value is $2,300 per incident\n• 72% of cases show signs of prior surveillance" + caseContext;
  }

  // Security recommendations
  if (lowerQuestion.includes('security') || lowerQuestion.includes('prevent')) {
    return "To prevent future thefts, I recommend:\n\n• Install motion-activated lighting around entry points\n• Upgrade door locks to deadbolts with reinforced strike plates\n• Install window sensors and glass-break detectors\n• Use timer switches to simulate occupancy when premises are empty\n• Consider a visible security camera system as a deterrent\n• Maintain an inventory of valuable items with serial numbers" + caseContext;
  }

  // Evidence collection
  if (lowerQuestion.includes('evidence') || lowerQuestion.includes('collect')) {
    return "For theft investigations, prioritize collecting:\n\n• Fingerprints from entry points and high-value item locations\n• Surveillance footage from the property and surrounding areas\n• Shoe impressions near entry/exit points\n• Tool marks on damaged locks or windows\n• Witness statements from neighbors about suspicious activity\n• Recent visitor logs or delivery records" + caseContext;
  }

  // Stolen goods tracking
  if (lowerQuestion.includes('track') || lowerQuestion.includes('recover') || lowerQuestion.includes('stolen')) {
    return "To track stolen items, I recommend:\n\n• Check local pawn shops and online marketplaces (eBay, Facebook Marketplace, Craigslist)\n• Activate tracking features on stolen electronics if available\n• Monitor for serial numbers appearing in reseller databases\n• Coordinate with neighboring jurisdictions as thieves often sell items outside their theft area\n• Check with confidential informants who specialize in stolen goods" + caseContext;
  }

  // Default response
  return "I'm Agent Theft, specialized in theft investigations and pattern analysis. I can provide insights on theft patterns, security recommendations, evidence collection strategies, and stolen goods tracking. How can I assist with your investigation today?" + caseContext;
};

// Chain Snatching Agent responses
export const generateChainSnatchingAgentResponse = (question: string, context?: ChatContext): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Add case context to the response if available
  const caseContext = context ?
    `\n\nCase Details: ${context.caseId || 'N/A'} | ${context.caseTitle || 'Chain Snatching Case'} | Priority: ${context.casePriority || 'Medium'} | Status: ${context.caseStatus || 'Open'}` : '';

  // Hotspot mapping
  if (lowerQuestion.includes('hotspot') || lowerQuestion.includes('location') || lowerQuestion.includes('where')) {
    return "Chain snatching hotspot analysis shows:\n\n• Market areas with high pedestrian traffic (42% of incidents)\n• Public transportation entry/exit points (28%)\n• Tourist-frequented areas (18%)\n• Poorly lit residential streets near main roads (12%)\n\nThe highest concentration is currently in the Central Market district between 5-7 PM." + caseContext;
  }

  // Victim profiling
  if (lowerQuestion.includes('victim') || lowerQuestion.includes('target')) {
    return "Chain snatching victim profile analysis indicates:\n\n• Primary targets are women (76%) wearing visible gold jewelry\n• Age demographic is typically 40-65 years (62%)\n• Victims are usually alone or in pairs (88%)\n• Most victims are distracted by shopping, phone use, or conversation\n• Tourists and visitors unfamiliar with local crime patterns are frequently targeted" + caseContext;
  }

  // Offender tracking
  if (lowerQuestion.includes('offender') || lowerQuestion.includes('suspect') || lowerQuestion.includes('criminal')) {
    return "Chain snatching offender analysis shows:\n\n• Typically young males aged 18-25 (82%)\n• Usually operate in pairs - one snatcher, one getaway driver\n• Use motorcycles or scooters for quick escape (74%)\n• Often wear helmets to conceal identity and protect during escape\n• Most active during evening rush hours (5-7 PM)\n• Typically sell stolen items to specific gold buyers within 24 hours" + caseContext;
  }

  // Prevention strategies
  if (lowerQuestion.includes('prevent') || lowerQuestion.includes('strategy') || lowerQuestion.includes('stop')) {
    return "Effective chain snatching prevention strategies include:\n\n• Increased visible police presence at identified hotspots\n• Plainclothes officers in high-risk areas\n• Public awareness campaigns targeting potential victims\n• CCTV monitoring at key locations with real-time alerts\n• Coordination with jewelry stores and gold buyers to identify stolen items\n• Community WhatsApp groups for real-time incident reporting" + caseContext;
  }

  // Default response
  return "I'm Agent Chain Snatching, specialized in chain snatching cases and criminal profiling. I can provide insights on hotspot mapping, victim profiles, offender tracking, and prevention strategies. How can I assist with your investigation today?" + caseContext;
};

// Murder Agent responses
export const generateMurderAgentResponse = (question: string, context?: ChatContext): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Add case context to the response if available
  const caseContext = context ?
    `\n\nCase Details: ${context.caseId || 'N/A'} | ${context.caseTitle || 'Homicide Case'} | Priority: ${context.casePriority || 'High'} | Status: ${context.caseStatus || 'Open'}` : '';

  // Forensic analysis
  if (lowerQuestion.includes('forensic') || lowerQuestion.includes('evidence')) {
    return "Critical forensic priorities for homicide investigation:\n\n• Secure crime scene and establish chain of custody immediately\n• Document body position, lividity, and rigor mortis before moving\n• Collect trace evidence (hair, fibers, DNA) before body removal\n• Photograph and document blood spatter patterns for reconstruction\n• Collect fingerprints, footprints, and tool marks\n• Preserve digital evidence (phones, computers, surveillance)" + caseContext;
  }

  // Motive assessment
  if (lowerQuestion.includes('motive') || lowerQuestion.includes('why')) {
    return "Common homicide motives to investigate:\n\n• Personal conflict (38% of cases) - examine recent arguments, threats\n• Financial gain (22%) - check victim's will, insurance, business dealings\n• Domestic violence (18%) - review relationship history, prior incidents\n• Criminal activity (12%) - examine victim's connections to illegal activities\n• Mental illness (8%) - look for behavioral patterns, prior incidents\n• Mistaken identity (2%) - consider if intended target was someone else" + caseContext;
  }

  // Suspect profiling
  if (lowerQuestion.includes('suspect') || lowerQuestion.includes('profile') || lowerQuestion.includes('who')) {
    return "Homicide suspect profiling considerations:\n\n• Start with victim's close circle - 64% of homicides are committed by someone known to the victim\n• Examine relationship history - spouses, partners, family members\n• Check for financial beneficiaries of victim's death\n• Review victim's last 24-48 hours of activity and contacts\n• Analyze crime scene for signs of planning vs. impulsive action\n• Consider level of violence as indicator of relationship to victim" + caseContext;
  }

  // Timeline reconstruction
  if (lowerQuestion.includes('timeline') || lowerQuestion.includes('when')) {
    return "Homicide timeline reconstruction steps:\n\n• Establish time of death (TOD) through body temperature, lividity, stomach contents\n• Document victim's last known activities and communications\n• Collect and analyze digital footprints (phone records, social media, GPS)\n• Interview witnesses about victim's movements prior to death\n• Review surveillance footage from relevant locations\n• Create timeline visualization to identify gaps and inconsistencies" + caseContext;
  }

  // Default response
  return "I'm Agent Murder, specialized in homicide investigations and forensic analysis. I can provide insights on forensic priorities, motive assessment, suspect profiling, and timeline reconstruction. How can I assist with your investigation today?" + caseContext;
};

// Accident Agent responses
export const generateAccidentAgentResponse = (question: string, context?: ChatContext): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Add case context to the response if available
  const caseContext = context ?
    `\n\nCase Details: ${context.caseId || 'N/A'} | ${context.caseTitle || 'Accident Case'} | Priority: ${context.casePriority || 'Medium'} | Status: ${context.caseStatus || 'Open'}` : '';

  // Accident reconstruction
  if (lowerQuestion.includes('reconstruct') || lowerQuestion.includes('how')) {
    return "Accident reconstruction methodology:\n\n• Document scene with photos, videos, and measurements before evidence is moved\n• Collect physical evidence (skid marks, debris field, point of impact)\n• Measure and document vehicle damage patterns\n• Interview witnesses for visual perspectives\n• Analyze vehicle data recorders (black boxes) if available\n• Create scaled diagrams and 3D models for analysis\n• Calculate speeds based on skid marks, damage, and final positions" + caseContext;
  }

  // Cause analysis
  if (lowerQuestion.includes('cause') || lowerQuestion.includes('why')) {
    return "Common accident causes to investigate:\n\n• Driver factors (68%): impairment, distraction, fatigue, speeding\n• Vehicle factors (12%): mechanical failures, maintenance issues\n• Environmental factors (14%): road conditions, weather, visibility\n• Infrastructure factors (6%): road design, signage, traffic control\n\nAlways consider multiple contributing factors rather than a single cause." + caseContext;
  }

  // Negligence assessment
  if (lowerQuestion.includes('negligence') || lowerQuestion.includes('fault') || lowerQuestion.includes('liability')) {
    return "Negligence assessment framework:\n\n• Duty of care: Establish what standard of care was required\n• Breach of duty: Determine if actions fell below required standard\n• Causation: Establish direct link between breach and damages\n• Damages: Document injuries, property damage, and other losses\n\nCollect evidence of potential negligence indicators:\n• Violation of traffic laws or regulations\n• Distracted driving (phone records, witness statements)\n• Impairment (toxicology results)\n• Vehicle maintenance records\n• Prior similar incidents or patterns" + caseContext;
  }

  // Evidence collection
  if (lowerQuestion.includes('evidence') || lowerQuestion.includes('collect')) {
    return "Critical evidence for accident investigation:\n\n• Scene documentation: photos, videos, measurements, drone footage\n• Physical evidence: tire marks, gouges, fluid trails, debris field\n• Vehicle data: EDR data, damage patterns, mechanical condition\n• Environmental factors: road conditions, weather reports, visibility\n• Witness statements: perspectives from different angles\n• Video evidence: traffic cameras, dashcams, security footage\n• Medical records: injuries consistent with accident dynamics\n• Digital evidence: phone records, GPS data, social media" + caseContext;
  }

  // Default response
  return "I'm Agent Accident, specialized in accident reconstruction and investigation. I can provide insights on reconstruction methodology, cause analysis, negligence assessment, and evidence collection. How can I assist with your investigation today?" + caseContext;
};

// Abuse Agent responses
export const generateAbuseAgentResponse = (question: string, context?: ChatContext): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Add case context to the response if available
  const caseContext = context ?
    `\n\nCase Details: ${context.caseId || 'N/A'} | ${context.caseTitle || 'Abuse Case'} | Priority: ${context.casePriority || 'High'} | Status: ${context.caseStatus || 'Open'}` : '';

  // Victim support
  if (lowerQuestion.includes('victim') || lowerQuestion.includes('support')) {
    return "Victim-centered approach for abuse cases:\n\n• Ensure immediate safety and medical needs are addressed\n• Conduct interviews in safe, comfortable environments\n• Use trauma-informed questioning techniques\n• Connect victims with appropriate support services:\n  - Emergency housing/shelter options\n  - Medical care and mental health services\n  - Legal advocacy and protection orders\n  - Financial assistance resources\n• Minimize repeated interviews to prevent re-traumatization\n• Keep victims informed about case progress and safety planning" + caseContext;
  }

  // Pattern recognition
  if (lowerQuestion.includes('pattern') || lowerQuestion.includes('identify')) {
    return "Abuse pattern indicators to document:\n\n• Escalation in frequency and severity over time\n• Cycle patterns: tension building → incident → reconciliation → calm\n• Power and control tactics: isolation, economic control, intimidation\n• Previous incidents and reports (even if withdrawn)\n• Digital evidence of control: excessive texts, location tracking\n• Witness accounts of behavioral changes in victim\n• Medical history showing injuries consistent with abuse\n\nDocumenting patterns is critical for establishing the ongoing nature of abuse." + caseContext;
  }

  // Risk assessment
  if (lowerQuestion.includes('risk') || lowerQuestion.includes('danger')) {
    return "High-risk indicators in abuse cases:\n\n• Threats of homicide or suicide\n• Access to weapons\n• Recent separation or threats of separation\n• Extreme jealousy or possessiveness\n• Strangulation attempts (increases homicide risk by 750%)\n• Controlling behaviors and stalking\n• Violation of protection orders\n• Substance abuse issues\n• Unemployment or financial stress\n\nIf multiple high-risk factors are present, consider immediate safety interventions and monitoring." + caseContext;
  }

  // Evidence collection
  if (lowerQuestion.includes('evidence') || lowerQuestion.includes('document')) {
    return "Critical evidence in abuse investigations:\n\n• Photographs of injuries (immediate and follow-up as bruises develop)\n• Medical records and examiner statements\n• 911 calls and police reports (current and previous)\n• Text messages, emails, voicemails showing threats or control\n• Social media posts or messages\n• Witness statements from family, friends, neighbors\n• Video/audio recordings of incidents\n• Journal entries or documentation kept by victim\n• Protection orders and violation documentation" + caseContext;
  }

  // Default response
  return "I'm Agent Abuse, specialized in abuse cases and victim support. I can provide insights on victim-centered approaches, pattern recognition, risk assessment, and evidence collection for abuse cases. How can I assist with your investigation today?" + caseContext;
};

// Main function to generate responses based on agent type
export const generateAgentResponse = (question: string, agentType: AgentType, context?: ChatContext): string => {
  // Get specialized agent prompt if available
  const specializedPrompt = defaultSettings.specializedAgentPrompts[agentType as keyof typeof defaultSettings.specializedAgentPrompts];

  // Add prompt to context if available
  const contextWithPrompt = context ? {
    ...context,
    systemPrompt: specializedPrompt
  } : specializedPrompt ? {
    systemPrompt: specializedPrompt
  } : undefined;

  switch (agentType) {
    case 'crime-theft':
      return generateTheftAgentResponse(question, contextWithPrompt);
    case 'crime-chain-snatching':
      return generateChainSnatchingAgentResponse(question, contextWithPrompt);
    case 'crime-murder':
    case 'murder':
      return generateMurderAgentResponse(question, contextWithPrompt);
    case 'murder-chief':
      return `As the Murder Chief, I'm leading the investigation on Murder Case 1. ${generateMurderAgentResponse(question, contextWithPrompt)}`;
    case 'murder-cop-2':
      return `As Murder Cop 2, I'm working on Murder Case 2 which is currently in progress. ${generateMurderAgentResponse(question, contextWithPrompt)}`;
    case 'murder-case-3':
      return `As the specialized investigator for Murder Case 3, I'm focusing on this complex open case. ${generateMurderAgentResponse(question, contextWithPrompt)}`;
    case 'crime-accident':
      return generateAccidentAgentResponse(question, contextWithPrompt);
    case 'crime-abuse':
      return generateAbuseAgentResponse(question, contextWithPrompt);
    case 'crime':
      return generateCrimeAgentResponse(question);
    case 'financial-fraud':
    case 'finance':
      return generateFinancialFraudAgentResponse(question);
    case 'exchange-matching':
      return generateExchangeMatchingAgentResponse(question);
    case 'general':
    default:
      return generateGeneralAgentResponse(question);
  }
};
