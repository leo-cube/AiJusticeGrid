/* eslint-disable */
import React from 'react';

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'investigator';
  badgeNumber: string;
  department: string;
  avatar?: string;
}

// Authentication types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Crime types
export interface Crime {
  id: string;
  title: string;
  type: string;
  date: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'open' | 'in-progress' | 'closed';
  severity: 'low' | 'medium' | 'high';
  assignedTo?: string;
  description: string;
  evidence?: Evidence[];
}

export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'video' | 'other';
  title: string;
  description: string;
  fileUrl?: string;
  dateAdded: string;
  addedBy: string;
}

// Financial Fraud types
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
  stocks?: Stock[];
  transactions?: Transaction[];
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  fromEntity: string;
  toEntity: string;
  type: string;
}

// Exchange Matching types
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

// Agent types
export type AgentType =
  | 'general'
  | 'murder'
  | 'finance'
  | 'theft'
  | 'smuggle'
  | 'murder-chief'
  | 'murder-cop-2'
  | 'murder-case-3'
  | 'crime-accident'
  | 'crime-abuse';

export interface Case {
  id: string;
  name: string;
  assignedTo: string;
  status: 'open' | 'in-progress' | 'closed';
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  date?: string;
}

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

// Chat types
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  agentType: AgentType;
  caseId?: string; // Reference to the case this message is about
  context?: ChatContextType; // Additional context for the message
}

// Chat context for specialized agents
export interface ChatContextType {
  agentType?: AgentType;
  agentName?: string;
  caseId?: string;
  caseName?: string;
  caseType?: string;
  caseTitle?: string;
  caseStatus?: string;
  casePriority?: string;
  assignedTo?: string;
  assignedDate?: string;
  evidence?: Evidence[];
  systemPrompt?: string;
  [key: string]: any; // Allow for additional context properties
}

// Dashboard types
export interface DashboardStats {
  activeInvestigations: number;
  recentCrimes: number;
  financialFraudCases: number;
  exchangeMismatches: number;
}

// Report types
export interface Report {
  id: string;
  title: string;
  type: string;
  date: string;
  author: string;
  status: 'draft' | 'published';
  description: string;
}

// API Report types
export interface ApiReport {
  id: string;
  title: string;
  caseId: string;
  caseType: string;
  generatedDate: string;
  generatedBy: string;
  status: 'pending' | 'completed' | 'error';
  panels: DesignatedPanel[];
}

// Designated Panel types
export interface DesignatedPanel {
  id: string;
  title: string;
  type: 'summary' | 'analysis' | 'evidence' | 'recommendations' | 'timeline' | 'custom';
  content: string;
  metadata?: {
    [key: string]: any;
  };
  priority?: 'high' | 'medium' | 'low';
  assignedTo?: string;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}
