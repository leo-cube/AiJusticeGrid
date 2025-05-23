/* eslint-disable */
import defaultSettings from '@/config/defaultSettings.json';
import { Crime, FinancialFraud, ExchangeMatch, Agent, User, ApiReport, DesignatedPanel } from '@/app/types';

// Import mock data from default settings
const { crimeTypes, agentTypes, agentAssignments } = defaultSettings;

// Initialize mock agent status data from default settings
const mockAgentStatus: Record<string, boolean> = defaultSettings.enabledAgents || {};

// Mock user data
const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@police.gov',
  role: 'admin',
  badgeNumber: 'PD12345',
  department: 'Cyber Crime Unit',
  avatar: '/images/prtection.png',
};

// Mock crimes data
const mockCrimes: Crime[] = [
  {
    id: 'CR-1001',
    title: 'Bank Robbery',
    type: 'theft',
    date: '2025-05-01',
    location: {
      lat: 40.7128,
      lng: -74.006,
      address: '123 Wall Street, New York, NY'
    },
    status: 'open',
    severity: 'high',
    assignedTo: 'John Doe',
    description: 'Armed robbery at First National Bank'
  },
  {
    id: 'CR-1002',
    title: 'Credit Card Fraud',
    type: 'financial-fraud',
    date: '2025-05-03',
    location: {
      lat: 40.7142,
      lng: -74.0119,
      address: '456 Broadway, New York, NY'
    },
    status: 'in-progress',
    severity: 'medium',
    assignedTo: 'Jane Smith',
    description: 'Multiple fraudulent credit card transactions detected'
  },
  // More mock crimes can be added here
];

// Mock financial fraud data
const mockFinancialFrauds: FinancialFraud[] = [
  {
    id: 'FF-2001',
    date: '2025-05-12',
    fraudType: 'Insider Trading',
    entities: ['XYZ Corp', 'John Smith'],
    amount: 1250000,
    currency: 'USD',
    detectionMethod: 'Pattern Analysis',
    riskScore: 85,
    status: 'detected',
    stocks: [
      { id: 'S1', symbol: 'XYZ', name: 'XYZ Corporation', price: 45.67, change: 12.5, volume: 1500000 }
    ],
    transactions: [
      { id: 'T1', date: '2025-05-10', amount: 500000, currency: 'USD', fromEntity: 'John Smith', toEntity: 'Offshore Account', type: 'Wire Transfer' },
      { id: 'T2', date: '2025-05-11', amount: 750000, currency: 'USD', fromEntity: 'John Smith', toEntity: 'Investment Account', type: 'Stock Purchase' }
    ]
  },
  // More mock financial frauds can be added here
];

// Mock exchange matches data
const mockExchangeMatches: ExchangeMatch[] = [
  {
    id: 'EM-3001',
    exchange1: 'Global Exchange A',
    exchange2: 'Offshore Exchange B',
    mismatchType: 'Transaction Volume Discrepancy',
    severityScore: 92,
    date: '2025-05-10',
    detectionMethod: 'Automated Pattern Analysis',
    status: 'detected'
  },
  // More mock exchange matches can be added here
];

// Mock API reports data
const mockApiReports: ApiReport[] = [
  {
    id: 'API-1001',
    title: 'Theft Case Analysis',
    caseId: 'CR-1001',
    caseType: 'theft',
    generatedDate: '2025-05-10',
    generatedBy: 'Agent Theft',
    status: 'completed',
    panels: [
      {
        id: 'PANEL-1001-1',
        title: 'Case Summary',
        type: 'summary',
        content: 'Armed robbery at First National Bank. Suspects entered through the rear entrance at 10:15 AM and left with approximately $50,000 in cash.',
        priority: 'high',
      },
      {
        id: 'PANEL-1001-2',
        title: 'Evidence Analysis',
        type: 'evidence',
        content: 'Security footage shows three masked individuals. Fingerprints recovered from the counter match those of a known offender. Weapon appears to be a 9mm handgun based on recovered shell casings.',
        priority: 'medium',
      },
      {
        id: 'PANEL-1001-3',
        title: 'Recommendations',
        type: 'recommendations',
        content: 'Interview bank staff who were present during the robbery. Cross-reference the timing with nearby traffic cameras. Check for similar MO in recent robberies.',
        priority: 'high',
        assignedTo: 'John Doe',
      }
    ]
  },
  {
    id: 'API-1002',
    title: 'Financial Fraud Investigation',
    caseId: 'CR-1002',
    caseType: 'financial-fraud',
    generatedDate: '2025-05-12',
    generatedBy: 'Agent Finance',
    status: 'completed',
    panels: [
      {
        id: 'PANEL-1002-1',
        title: 'Fraud Pattern Analysis',
        type: 'analysis',
        content: 'Multiple fraudulent credit card transactions detected across 15 different merchants. All transactions occurred within a 48-hour window. Total fraud amount: $12,345.',
        priority: 'high',
      },
      {
        id: 'PANEL-1002-2',
        title: 'Timeline of Events',
        type: 'timeline',
        content: 'May 1: First fraudulent transaction\nMay 2: Peak of fraudulent activity\nMay 3: Last known transaction\nMay 4: Fraud detection system alert',
        priority: 'medium',
      }
    ]
  },
  {
    id: 'API-1003',
    title: 'Murder Investigation Report',
    caseId: 'murder-case-1',
    caseType: 'murder',
    generatedDate: '2025-05-15',
    generatedBy: 'Murder Chief',
    status: 'pending',
    panels: [
      {
        id: 'PANEL-1003-1',
        title: 'Forensic Analysis',
        type: 'analysis',
        content: 'Preliminary forensic analysis indicates the victim died from blunt force trauma to the head. Time of death estimated between 11 PM and 2 AM.',
        priority: 'high',
        assignedTo: 'Forensic Team',
      }
    ]
  }
];

// Mock dashboard data
const mockDashboard = {
  stats: [
    {
      id: 1,
      name: 'Active Investigations',
      value: 24,
      change: 12,
      changeType: 'increase',
      icon: 'ChartBarIcon',
      clickable: true,
    },
    {
      id: 2,
      name: 'Crimes Reported',
      value: 38,
      change: 2,
      changeType: 'decrease',
      icon: 'DocumentTextIcon',
      clickable: true,
    },
  ],
  caseTrends: [
    { id: 1, name: 'Solving', count: 12, color: 'bg-green-100 text-green-800' },
    { id: 2, name: 'Losing', count: 5, color: 'bg-red-100 text-red-800' },
    { id: 3, name: 'Dormant', count: 7, color: 'bg-gray-100 text-gray-800' },
  ],
  crimeCategories: crimeTypes.map((type, index) => ({
    id: index + 1,
    name: type.name,
    count: Math.floor(Math.random() * 20) + 1,
    color: type.color
  })),
};

// Mock agent assignments
const mockAgentAssignments = Object.entries(agentAssignments).map(([crimeType, agentType], index) => ({
  id: `AA-${1001 + index}`,
  agentName: `Agent ${agentType.charAt(0).toUpperCase() + agentType.slice(1)}`,
  agentType,
  role: 'lead',
  status: 'active',
  caseId: `CR-${1001 + index}`,
  caseTitle: `${crimeType.charAt(0).toUpperCase() + crimeType.slice(1)} Case`,
  caseType: crimeType,
  caseStatus: 'in-progress',
  assignedDate: '2025-05-01',
  priority: 'high',
}));

// Mock suggested questions by agent type
const mockSuggestedQuestions = {
  'degree-guru': [
    'Are there resources for students interested in creative writing?',
    'Are there any workshops or seminars on entrepreneurship for students?',
    'Are there courses on environmental sustainability?',
    'What kinds of courses will I take as a philosophy major?'
  ],
  'general': [
    'What can you help me with?',
    'Tell me about the latest cases',
    'How do I analyze evidence?',
    'What investigation techniques should I use?'
  ],
  'crime': [
    'What are the recent crime statistics in the area?',
    'How do I report suspicious activity?',
    'What evidence is needed for a crime investigation?',
    'How are crime scenes processed?'
  ],
  'murder': [
    'What are the key steps in a homicide investigation?',
    'How is forensic evidence collected at a murder scene?',
    'What techniques are used for suspect profiling?',
    'How are witness testimonies verified?'
  ],
  'finance': [
    'What are common financial fraud indicators?',
    'How do you trace money laundering activities?',
    'What financial documents should be analyzed in fraud cases?',
    'How are digital financial crimes investigated?'
  ],
  'theft': [
    'What are the most common theft patterns?',
    'How do you track stolen goods?',
    'What security measures prevent theft?',
    'How do you identify professional thieves?'
  ],
  'smuggle': [
    'What are common smuggling routes?',
    'How are smuggled goods detected?',
    'What technologies are used to prevent smuggling?',
    'How do international agencies coordinate on smuggling cases?'
  ],
  'crime-accident': [
    'How do you determine if an accident was staged?',
    'What evidence is crucial in accident reconstruction?',
    'How do you analyze vehicle damage patterns?',
    'What factors indicate negligence in accidents?'
  ],
  'crime-abuse': [
    'What are the signs of domestic abuse?',
    'How do you interview abuse victims sensitively?',
    'What evidence collection protocols exist for abuse cases?',
    'How do you ensure victim safety during investigations?'
  ]
};

// Mock API endpoints
const mockApi = {
  '/auth/login': { user: mockUser, token: 'mock-token' },
  '/auth/logout': { success: true },
  '/auth/validate': { valid: true, user: mockUser },
  '/crimes': mockCrimes,
  '/crime-types': crimeTypes,
  '/agents': agentTypes,
  '/agents/status': mockAgentStatus,
  '/assignments': mockAgentAssignments,
  '/financial-fraud': mockFinancialFrauds,
  '/exchange-matching': mockExchangeMatches,
  '/api-reports': mockApiReports,
  '/dashboard': mockDashboard,
  '/api/augment/suggested-questions': {
    success: true,
    data: mockSuggestedQuestions.general,
    message: 'Default suggested questions retrieved successfully'
  },
  '/settings': {
    ui: {
      login: {
        backgroundImage: '/images/invest.jpg'
      },
      theme: defaultSettings.ui.theme
    },
    auth: {
      demoCredentials: {
        email: 'admin@police.gov',
        password: 'password'
      }
    },
    api: defaultSettings.api
  },
};

// Mock API handlers for POST, PUT, DELETE
export const mockHandlers = {
  '/api/augment/toggle-agent': {
    get: () => {
      console.log('Mock API: GET /api/augment/toggle-agent');
      return {
        success: true,
        data: mockAgentStatus,
        message: "Successfully retrieved enabled agents"
      };
    },
    post: (data: { agentId: string; enabled: boolean }) => {
      console.log(`Mock API: POST /api/augment/toggle-agent - ${data.agentId} to ${data.enabled}`);

      // Update the mock agent status
      mockAgentStatus[data.agentId] = data.enabled;

      return {
        success: true,
        data: {
          agentId: data.agentId,
          enabled: data.enabled
        },
        message: `Agent ${data.agentId} has been ${data.enabled ? 'enabled' : 'disabled'}`
      };
    }
  },
  '/auth/login': {
    post: (data: { email: string; password: string }) => {
      if (data.email === 'admin@police.gov' && data.password === 'password') {
        return { user: mockUser, token: 'mock-token' };
      }
      throw new Error('Invalid credentials');
    }
  },
  '/auth/logout': {
    post: (data: any, headers?: Record<string, string>) => {
      // Check if the token is valid (in a real app, this would verify the token)
      const authHeader = headers?.Authorization || '';
      const token = authHeader.replace('Bearer ', '');

      if (token === 'mock-token') {
        return { success: true };
      }

      // If token is invalid, throw an error
      throw new Error('Invalid token');
    }
  },
  '/auth/validate': {
    get: (headers?: Record<string, string>) => {
      // Check if the token is valid (in a real app, this would verify the token)
      const authHeader = headers?.Authorization || '';
      const token = authHeader.replace('Bearer ', '');

      if (token === 'mock-token') {
        return { valid: true, user: mockUser };
      }

      // If token is invalid, throw an error
      throw new Error('Invalid token');
    }
  },
  '/crimes': {
    post: (data: Partial<Crime>) => {
      const newCrime = {
        ...data,
        id: `CR-${1000 + mockCrimes.length + 1}`,
        date: data.date || new Date().toISOString().split('T')[0],
      };
      mockCrimes.push(newCrime as Crime);
      return newCrime;
    },
    put: (data: Crime) => {
      const index = mockCrimes.findIndex(crime => crime.id === data.id);
      if (index !== -1) {
        mockCrimes[index] = data;
        return data;
      }
      throw new Error('Crime not found');
    },
    delete: (id: string) => {
      const index = mockCrimes.findIndex(crime => crime.id === id);
      if (index !== -1) {
        mockCrimes.splice(index, 1);
        return { success: true };
      }
      throw new Error('Crime not found');
    }
  },
  '/agents/status': {
    get: () => {
      console.log('Mock API: GET /agents/status - Returning:', mockAgentStatus);
      return mockAgentStatus;
    },
    put: (data: { agentId: string; enabled: boolean }) => {
      // Validate request
      if (!data.agentId || typeof data.enabled !== 'boolean') {
        console.error('Mock API: Invalid PUT request to /agents/status:', data);
        throw new Error('Invalid request. Required fields: agentId, enabled');
      }

      console.log(`Mock API: PUT /agents/status - Setting ${data.agentId} to ${data.enabled}`);

      // Update agent status
      mockAgentStatus[data.agentId] = data.enabled;

      // Return updated status
      return {
        agentId: data.agentId,
        enabled: data.enabled,
        message: `Agent ${data.agentId} ${data.enabled ? 'enabled' : 'disabled'} successfully`
      };
    },
    patch: (data: { agents: Record<string, boolean> }) => {
      // Validate request
      if (!data.agents || typeof data.agents !== 'object') {
        console.error('Mock API: Invalid PATCH request to /agents/status:', data);
        throw new Error('Invalid request. Required field: agents (object)');
      }

      console.log('Mock API: PATCH /agents/status - Updating multiple agents:', data.agents);

      // Update agent statuses
      Object.assign(mockAgentStatus, data.agents);

      console.log('Mock API: Updated agent statuses:', mockAgentStatus);

      // Return updated statuses
      return {
        agents: mockAgentStatus,
        message: 'Agent statuses updated successfully'
      };
    }
  },
  '/api-reports': {
    post: (data: Partial<ApiReport>) => {
      // Validate required fields
      if (!data.title || !data.caseId || !data.caseType) {
        throw new Error('Invalid request. Required fields: title, caseId, caseType');
      }

      // Create new API report
      const newReport: ApiReport = {
        id: `API-${1000 + mockApiReports.length + 1}`,
        title: data.title,
        caseId: data.caseId,
        caseType: data.caseType,
        generatedDate: data.generatedDate || new Date().toISOString().split('T')[0],
        generatedBy: data.generatedBy || 'System',
        status: data.status || 'pending',
        panels: data.panels || [],
      };

      // Add to mock data
      mockApiReports.push(newReport);

      return newReport;
    }
  },
  '/designated-panels': {
    post: (data: { reportId: string; panel: Partial<DesignatedPanel> }) => {
      // Validate required fields
      if (!data.reportId || !data.panel || !data.panel.title || !data.panel.type || !data.panel.content) {
        throw new Error('Invalid request. Required fields: reportId, panel (with title, type, content)');
      }

      // Find the report
      const report = mockApiReports.find(r => r.id === data.reportId);
      if (!report) {
        throw new Error(`Report not found: ${data.reportId}`);
      }

      // Create new panel
      const newPanel: DesignatedPanel = {
        id: `PANEL-${report.id}-${report.panels.length + 1}`,
        title: data.panel.title,
        type: data.panel.type,
        content: data.panel.content,
        priority: data.panel.priority || 'medium',
        assignedTo: data.panel.assignedTo,
        metadata: data.panel.metadata,
      };

      // Add to report panels
      report.panels.push(newPanel);

      return newPanel;
    }
  },
  // Add more handlers as needed
  '/api/augment/suggested-questions': {
    get: (headers?: Record<string, string>, url?: string) => {
      // Extract agentType from URL query parameters
      let agentType = 'general';

      if (url && url.includes('?')) {
        const queryString = url.split('?')[1];
        const params = new URLSearchParams(queryString);
        agentType = params.get('agentType') || 'general';
      }

      console.log(`Mock API: Fetching suggested questions for agent type: ${agentType}`);

      // Get the suggested questions for the specified agent type
      const questions = mockSuggestedQuestions[agentType as keyof typeof mockSuggestedQuestions] ||
                        mockSuggestedQuestions.general;

      return {
        success: true,
        data: questions,
        message: `Suggested questions for ${agentType} retrieved successfully`
      };
    }
  },
  '/settings': {
    put: (data: any) => {
      // Update the mock settings with the new data
      const updatedSettings = {
        ...mockApi['/settings'],
        ...data
      };

      // Update the mockApi object with the new settings
      mockApi['/settings'] = updatedSettings;

      console.log('Mock API: Settings updated successfully', updatedSettings);

      // Return the updated settings
      return updatedSettings;
    }
  }
};

export default mockApi;
