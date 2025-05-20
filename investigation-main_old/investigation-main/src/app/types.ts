// Agent types
export type AgentType =
  // Main agent types
  'general' | 'crime' | 'financial-fraud' | 'exchange-matching' | 'degree-guru' |
  // Specialized crime agents
  'murder' | 'theft' | 'smuggle' | 'crime-accident' | 'crime-abuse' | 'crime-chain-snatching' |
  // Specialized murder agents
  'crime-murder' | 'murder-chief' | 'murder-cop-2' | 'murder-case-3' |
  // Specialized finance agents
  'finance';

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  badgeNumber: string;
  department: string;
  avatar: string;
}

// Authentication state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Location type
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

// Crime type
export interface Crime {
  id: string;
  title: string;
  type: string;
  date: string;
  location: Location;
  status: 'open' | 'in-progress' | 'closed';
  severity: 'low' | 'medium' | 'high';
  assignedTo: string;
  description: string;
}

// Stock type
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

// Transaction type
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  fromEntity: string;
  toEntity: string;
  type: string;
}

// Financial Fraud type
export interface FinancialFraud {
  id: string;
  date: string;
  fraudType: string;
  entities: string[];
  amount: number;
  currency: string;
  detectionMethod: string;
  riskScore: number;
  status: 'detected' | 'investigating' | 'resolved';
  stocks: Stock[];
  transactions: Transaction[];
}

// Exchange Match type
export interface ExchangeMatch {
  id: string;
  exchange1: string;
  exchange2: string;
  mismatchType: string;
  severityScore: number;
  date: string;
  detectionMethod: string;
  status: 'detected' | 'investigating' | 'resolved';
}

// Case type
export interface Case {
  id: string;
  name: string;
  assignedTo: string;
  status: string;
}

// Agent type
export interface Agent {
  id: string;
  name: string;
  type?: AgentType;
  description: string;
  capabilities: string[];
  avatarColor: string;
  parentType?: AgentType;
  crimeType?: string;
  cases?: Case[];
}

// Chat message type
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  agentType: AgentType;
  context?: ChatContextType;
}

// Chat context type for case-specific information
export interface ChatContextType {
  agentType?: AgentType;
  agentName?: string;
  caseId?: string;
  caseName?: string;
  caseTitle?: string;
  caseStatus?: string;
  casePriority?: string;
  assignedTo?: string;
  assignedDate?: string;
  systemPrompt?: string;
  usingLiveBackend?: boolean;

  // Murder case specific fields
  crimeDate?: string;
  crimeTime?: string;
  location?: string;
  victimName?: string;
  victimAge?: string;
  victimGender?: string;
  causeOfDeath?: string;
  weaponUsed?: string;
  crimeSceneDescription?: string;
  witnesses?: string;
  evidence?: string;
  suspects?: string;

  // Interactive session fields
  sessionId?: string;
  isCollectingInfo?: boolean;
  currentStep?: string;
  collectedData?: Record<string, string>;
}

// Chat context provider type
export interface ChatContext {
  messages: ChatMessage[];
  isTyping: boolean;
  isChatOpen: boolean;
  currentAgent: AgentType;
  currentContext?: ChatContextType;
  sessionId?: string;
  isCollectingInfo?: boolean;
  currentStep?: string;
  collectedData?: Record<string, string>;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  toggleChat: () => void;
  setCurrentAgent: (agentType: AgentType, context?: ChatContextType) => void;
  resetSession?: () => void;
}

// Settings type
export interface Settings {
  api: {
    baseUrl: string;
    endpoints: Record<string, string>;
    timeout: number;
    retryAttempts: number;
  };
  ui: {
    theme: {
      primary: string;
      secondary: string;
      accent: string;
      error: string;
      warning: string;
      info: string;
      success: string;
    };
    dashboard: {
      refreshInterval: number;
      defaultView: string;
    };
    chat: {
      maxMessages: number;
      typingDelay: number;
    };
  };
  crimeTypes: {
    id: string;
    name: string;
    color: string;
    icon: string;
  }[];
  agentTypes: {
    id: string;
    name: string;
    description: string;
    avatarColor: string;
    capabilities: string[];
  }[];
  agentAssignments: Record<string, string>;
}
