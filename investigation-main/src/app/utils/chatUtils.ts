// Mock responses for the chat
export const generateMockResponse = (question: string): string => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();

  // Financial fraud location
  if (lowerQuestion.includes('financial fraud') && (lowerQuestion.includes('happen') || lowerQuestion.includes('where') || lowerQuestion.includes('location'))) {
    return "The most recent financial fraud occurred in the stock market involving XYZ Corp. It was detected on May 12th, 2025. The suspected fraud involves insider trading within the company's senior management. Based on our analysis, the transactions originated from the company's headquarters in New York.";
  }

  // Stock manipulation
  if (lowerQuestion.includes('stock') && (lowerQuestion.includes('manipulat') || lowerQuestion.includes('fraud'))) {
    return "The manipulated stocks are XYZ Corp, ABC Tech, and DEF Ltd. These stocks have experienced unusual trading volumes and price fluctuations, indicating possible insider trading. Our pattern analysis shows coordinated buying and selling activities just before major company announcements. The trading patterns suggest a sophisticated operation involving multiple accounts.";
  }

  // Crime categories
  if (lowerQuestion.includes('crime') && (lowerQuestion.includes('categor') || lowerQuestion.includes('type'))) {
    return "Recent crime categories include theft, assault, fraud, and financial fraud. The most prevalent crimes are related to financial fraud, particularly stock manipulation cases. We've seen a 27% increase in financial crimes compared to last quarter, with stock manipulation being the fastest growing subcategory.";
  }

  // Exchange match report
  if (lowerQuestion.includes('exchange match') || lowerQuestion.includes('exchange report')) {
    return "The latest exchange match report shows suspicious patterns between exchanges XYZ and ABC. These exchanges show significant discrepancies in transaction records, which suggest potential money laundering. Specifically, there's a $3.2M difference in reported transaction volumes for BTC/USD pairs between May 5-10, 2025. The transactions appear to be routed through multiple intermediaries to obscure their origin.";
  }

  // Investigation recommendations
  if (lowerQuestion.includes('recommend') && lowerQuestion.includes('investigation')) {
    return "I recommend focusing on the trading history of XYZ Corp over the past three weeks. Investigate the top traders and check for connections with the company's executives. It seems that insider information may have been leaked to these traders. Additionally, examine the trading patterns of accounts associated with board member James Wilson, as his trading activity correlates strongly with the suspicious transactions. Consider obtaining a warrant to access his communication records.";
  }

  // Money laundering patterns
  if (lowerQuestion.includes('money laundering') || (lowerQuestion.includes('launder') && lowerQuestion.includes('money'))) {
    return "We've detected potential money laundering patterns involving cryptocurrency exchanges. The scheme appears to use a technique called 'layering' where funds move through multiple exchanges and wallets to obscure their origin. The primary indicators include: unusual transaction sizes, irregular timing patterns, and the use of privacy coins. I recommend investigating accounts associated with Offshore Holdings Ltd, as they appear to be the final destination for many of these transactions.";
  }

  // Specific trader or suspect
  if (lowerQuestion.includes('trader') || lowerQuestion.includes('suspect')) {
    return "Based on our analysis, the primary suspect in the XYZ Corp fraud case is likely a high-level executive with access to earnings reports before publication. Trading patterns suggest this person shared information with at least 5 external traders. The most suspicious activity comes from trader ID #TR-7842, who made unusually large purchases just 48 hours before the earnings announcement. This trader has connections to three board members according to social media analysis.";
  }

  // Investigation timeline
  if (lowerQuestion.includes('timeline') || lowerQuestion.includes('when')) {
    return "The timeline of the financial fraud appears to be: March 15, 2025 - Initial suspicious transactions detected; April 2, 2025 - Large stock purchases by suspected insiders; April 10, 2025 - Company announcement causing 30% stock price increase; April 11, 2025 - Massive sell-off by the same accounts. The pattern suggests a coordinated effort timed precisely with corporate announcements.";
  }

  // Evidence collection
  if (lowerQuestion.includes('evidence') || lowerQuestion.includes('proof')) {
    return "The strongest evidence in the financial fraud case includes: 1) Trading records showing unusual options purchases before the announcement; 2) Communication metadata showing contact between suspects; 3) Timing correlation between information access and trading activity; 4) Unusual trading patterns deviating from historical behavior. I recommend securing electronic devices from the primary suspects to prevent evidence tampering.";
  }

  // Legal procedures
  if (lowerQuestion.includes('legal') || lowerQuestion.includes('law') || lowerQuestion.includes('regulation')) {
    return "This case involves potential violations of Securities Exchange Act Section 10(b) and SEC Rule 10b-5, which prohibit insider trading. To build a strong case, you'll need to establish: 1) The suspect possessed material non-public information; 2) The suspect had a duty to keep that information confidential; 3) The suspect breached that duty by sharing or acting on the information; 4) The suspect acted with intent (scienter). Consider consulting with the SEC enforcement division as they may have parallel investigations.";
  }

  // Default response
  return "I don't have specific information about that query. As your investigation assistant, I can provide insights on financial fraud patterns, stock manipulation, exchange matching discrepancies, money laundering techniques, suspect analysis, evidence collection strategies, and legal considerations. Could you provide more details or rephrase your question?";
};
