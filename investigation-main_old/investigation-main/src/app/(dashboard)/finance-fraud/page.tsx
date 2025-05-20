'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '@/services/api';
import defaultSettings from '@/config/defaultSettings.json';

// Define types for financial fraud data
interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  fromEntity: string;
  toEntity: string;
  type: string;
}

interface FinancialFraud {
  id: string;
  date: string;
  fraudType: string;
  entities: string[];
  amount: number;
  currency: string;
  detectionMethod: string;
  riskScore: number;
  status: string;
  stocks: Stock[];
  transactions: Transaction[];
}

// Mock financial fraud data as fallback
const mockFrauds: FinancialFraud[] = [
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
  {
    id: 'FF-2002',
    date: '2025-05-08',
    fraudType: 'Market Manipulation',
    entities: ['ABC Tech', 'Trading Group A'],
    amount: 3500000,
    currency: 'USD',
    detectionMethod: 'Anomaly Detection',
    riskScore: 92,
    status: 'investigating',
    stocks: [
      { id: 'S2', symbol: 'ABC', name: 'ABC Technology', price: 78.23, change: 15.8, volume: 2200000 }
    ],
    transactions: [
      { id: 'T3', date: '2025-05-06', amount: 1200000, currency: 'USD', fromEntity: 'Trading Group A', toEntity: 'Market Maker B', type: 'Stock Purchase' },
      { id: 'T4', date: '2025-05-07', amount: 2300000, currency: 'USD', fromEntity: 'Trading Group A', toEntity: 'Market Maker C', type: 'Stock Purchase' }
    ]
  },
  {
    id: 'FF-2003',
    date: '2025-05-05',
    fraudType: 'Accounting Fraud',
    entities: ['DEF Ltd', 'CFO Jane Doe'],
    amount: 5000000,
    currency: 'USD',
    detectionMethod: 'Whistleblower',
    riskScore: 78,
    status: 'investigating',
    stocks: [
      { id: 'S3', symbol: 'DEF', name: 'DEF Limited', price: 32.45, change: -8.2, volume: 1800000 }
    ],
    transactions: [
      { id: 'T5', date: '2025-05-01', amount: 2500000, currency: 'USD', fromEntity: 'DEF Ltd', toEntity: 'Shell Company X', type: 'Invoice Payment' },
      { id: 'T6', date: '2025-05-03', amount: 2500000, currency: 'USD', fromEntity: 'Shell Company X', toEntity: 'Offshore Account', type: 'Wire Transfer' }
    ]
  },
  {
    id: 'FF-2004',
    date: '2025-05-01',
    fraudType: 'Ponzi Scheme',
    entities: ['Investment Fund Z', 'Multiple Investors'],
    amount: 12000000,
    currency: 'USD',
    detectionMethod: 'Regulatory Audit',
    riskScore: 95,
    status: 'resolved',
    stocks: [],
    transactions: [
      { id: 'T7', date: '2025-04-15', amount: 5000000, currency: 'USD', fromEntity: 'Investor Group 1', toEntity: 'Investment Fund Z', type: 'Investment' },
      { id: 'T8', date: '2025-04-20', amount: 7000000, currency: 'USD', fromEntity: 'Investor Group 2', toEntity: 'Investment Fund Z', type: 'Investment' },
      { id: 'T9', date: '2025-04-25', amount: 3000000, currency: 'USD', fromEntity: 'Investment Fund Z', toEntity: 'Personal Account', type: 'Withdrawal' }
    ]
  },
  {
    id: 'FF-2005',
    date: '2025-04-28',
    fraudType: 'Money Laundering',
    entities: ['GHI Holdings', 'Multiple Shell Companies'],
    amount: 8500000,
    currency: 'USD',
    detectionMethod: 'Transaction Monitoring',
    riskScore: 88,
    status: 'investigating',
    stocks: [],
    transactions: [
      { id: 'T10', date: '2025-04-22', amount: 2800000, currency: 'USD', fromEntity: 'GHI Holdings', toEntity: 'Shell Company A', type: 'Wire Transfer' },
      { id: 'T11', date: '2025-04-24', amount: 2800000, currency: 'USD', fromEntity: 'Shell Company A', toEntity: 'Shell Company B', type: 'Wire Transfer' },
      { id: 'T12', date: '2025-04-26', amount: 2900000, currency: 'USD', fromEntity: 'Shell Company B', toEntity: 'Offshore Account', type: 'Wire Transfer' }
    ]
  }
];

export default function FinanceFraudPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFraud, setSelectedFraud] = useState<string | null>(null);
  const [frauds, setFrauds] = useState<FinancialFraud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAmount: '$0',
    totalAmountChange: 0,
    activeInvestigations: 0,
    activeInvestigationsChange: 0,
    resolvedCases: 0,
    resolvedCasesChange: 0,
    averageRiskScore: 0,
    averageRiskScoreChange: 0
  });

  // Fetch financial fraud data from API
  useEffect(() => {
    const fetchFinancialFrauds = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get financial fraud endpoint from config
        const financialFraudEndpoint = defaultSettings.api.endpoints.financialFraud;

        // Fetch financial fraud data from API
        const response = await apiService.get(financialFraudEndpoint);

        if (response) {
          // Set fraud data
          if (Array.isArray(response.frauds)) {
            setFrauds(response.frauds);
          } else if (Array.isArray(response)) {
            setFrauds(response);
          } else {
            // Fallback to mock data
            setFrauds(mockFrauds);
          }

          // Set stats if available in response
          if (response.stats) {
            setStats(response.stats);
          } else {
            // Calculate stats from fraud data
            calculateStats(Array.isArray(response.frauds) ? response.frauds :
                          Array.isArray(response) ? response : mockFrauds);
          }
        } else {
          // Fallback to mock data
          setFrauds(mockFrauds);
          calculateStats(mockFrauds);
        }
      } catch (error) {
        console.error('Error fetching financial fraud data:', error);
        setError('Failed to load financial fraud data. Please try again later.');

        // Fallback to mock data
        setFrauds(mockFrauds);
        calculateStats(mockFrauds);
      } finally {
        setIsLoading(false);
      }
    };

    // Calculate stats from fraud data
    const calculateStats = (fraudData: FinancialFraud[]) => {
      const totalAmount = fraudData.reduce((sum, fraud) => sum + fraud.amount, 0);
      const activeInvestigations = fraudData.filter(fraud =>
        fraud.status === 'detected' || fraud.status === 'investigating').length;
      const resolvedCases = fraudData.filter(fraud => fraud.status === 'resolved').length;
      const averageRiskScore = fraudData.reduce((sum, fraud) => sum + fraud.riskScore, 0) /
                              (fraudData.length || 1);

      setStats({
        totalAmount: `$${(totalAmount / 1000000).toFixed(2)}M`,
        totalAmountChange: 18.2, // Mock change percentage
        activeInvestigations,
        activeInvestigationsChange: 5.3, // Mock change percentage
        resolvedCases,
        resolvedCasesChange: 12.1, // Mock change percentage
        averageRiskScore: parseFloat(averageRiskScore.toFixed(1)),
        averageRiskScoreChange: 3.2 // Mock change percentage
      });
    };

    fetchFinancialFrauds();
  }, []);

  const filteredFrauds = frauds.filter(fraud =>
    fraud.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fraud.fraudType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fraud.entities.some(entity => entity.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFraudClick = (fraudId: string) => {
    setSelectedFraud(fraudId === selectedFraud ? null : fraudId);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-6 h-32"></div>
        ))}
      </div>

      <div className="bg-gray-100 rounded-lg p-6 h-96"></div>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
      <p className="text-red-800">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
      >
        Retry
      </button>
    </div>
  );

  // Show loading state
  if (isLoading && frauds.length === 0) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error && frauds.length === 0) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Fraud</h1>
          <p className="text-gray-500">Investigate financial fraud cases</p>
        </div>
        <Button onClick={() => {
          alert('New Financial Fraud Investigation form would open here');
          // In a real application, this would open a modal or navigate to a form
        }}>New Investigation</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Fraud Amount</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalAmount}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-red-500" />
              <span className="ml-1 text-sm font-medium text-red-500">{stats.totalAmountChange}%</span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Investigations</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeInvestigations}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <MagnifyingGlassIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-yellow-500" />
              <span className="ml-1 text-sm font-medium text-yellow-500">{stats.activeInvestigationsChange}%</span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved Cases</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.resolvedCases}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              <span className="ml-1 text-sm font-medium text-green-500">{stats.resolvedCasesChange}%</span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Risk Score</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.averageRiskScore}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-red-500" />
              <span className="ml-1 text-sm font-medium text-red-500">{stats.averageRiskScoreChange}%</span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fraud Cases</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search fraud cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button className="rounded-md border border-gray-300 p-2 text-gray-500 hover:bg-gray-50">
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Fraud Type</th>
                  <th className="px-4 py-3">Entities</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFrauds.map((fraud) => (
                  <React.Fragment key={fraud.id}>
                    <tr
                      className={`text-sm text-gray-900 ${selectedFraud === fraud.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => handleFraudClick(fraud.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{fraud.id}</td>
                      <td className="whitespace-nowrap px-4 py-3">{new Date(fraud.date).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-3">{fraud.fraudType}</td>
                      <td className="whitespace-nowrap px-4 py-3">{fraud.entities.join(', ')}</td>
                      <td className="whitespace-nowrap px-4 py-3">${(fraud.amount / 1000000).toFixed(2)}M</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center">
                          <span className={`mr-2 font-medium ${
                            fraud.riskScore >= 90 ? 'text-red-600' :
                            fraud.riskScore >= 70 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>{fraud.riskScore}</span>
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full ${
                                fraud.riskScore >= 90 ? 'bg-red-600' :
                                fraud.riskScore >= 70 ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${fraud.riskScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            fraud.status === 'detected'
                              ? 'bg-blue-100 text-blue-800'
                              : fraud.status === 'investigating'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {fraud.status === 'detected' ? 'Detected' : fraud.status === 'investigating' ? 'Investigating' : 'Resolved'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Button size="sm" variant="outline">View</Button>
                      </td>
                    </tr>
                    {selectedFraud === fraud.id && (
                      <tr>
                        <td colSpan={8} className="bg-blue-50 px-4 py-3">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Detection Method</h4>
                              <p>{fraud.detectionMethod}</p>
                            </div>

                            {fraud.stocks && fraud.stocks.length > 0 && (
                              <div>
                                <h4 className="font-medium">Involved Stocks</h4>
                                <div className="mt-2 overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                      <tr className="text-left text-xs font-medium uppercase text-gray-500">
                                        <th className="px-2 py-1">Symbol</th>
                                        <th className="px-2 py-1">Name</th>
                                        <th className="px-2 py-1">Price</th>
                                        <th className="px-2 py-1">Change</th>
                                        <th className="px-2 py-1">Volume</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {fraud.stocks.map(stock => (
                                        <tr key={stock.id} className="text-sm">
                                          <td className="px-2 py-1 font-medium">{stock.symbol}</td>
                                          <td className="px-2 py-1">{stock.name}</td>
                                          <td className="px-2 py-1">${stock.price.toFixed(2)}</td>
                                          <td className="px-2 py-1">
                                            <span className={stock.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                              {stock.change >= 0 ? '+' : ''}{stock.change}%
                                            </span>
                                          </td>
                                          <td className="px-2 py-1">{(stock.volume / 1000000).toFixed(1)}M</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-medium">Suspicious Transactions</h4>
                              <div className="mt-2 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead>
                                    <tr className="text-left text-xs font-medium uppercase text-gray-500">
                                      <th className="px-2 py-1">Date</th>
                                      <th className="px-2 py-1">Amount</th>
                                      <th className="px-2 py-1">From</th>
                                      <th className="px-2 py-1">To</th>
                                      <th className="px-2 py-1">Type</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {fraud.transactions.map(transaction => (
                                      <tr key={transaction.id} className="text-sm">
                                        <td className="px-2 py-1">{new Date(transaction.date).toLocaleDateString()}</td>
                                        <td className="px-2 py-1">${(transaction.amount / 1000000).toFixed(2)}M</td>
                                        <td className="px-2 py-1">{transaction.fromEntity}</td>
                                        <td className="px-2 py-1">{transaction.toEntity}</td>
                                        <td className="px-2 py-1">{transaction.type}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  alert(`Initiating investigation for fraud case ${fraud.id}`);
                                  // In a real application, this would start an investigation workflow
                                }}
                              >
                                Initiate Investigation
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  alert(`Freezing assets for entities: ${fraud.entities.join(', ')}`);
                                  // In a real application, this would trigger an asset freeze process
                                }}
                              >
                                Freeze Assets
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  alert(`Generating report for fraud case ${fraud.id}`);
                                  // In a real application, this would generate a detailed report
                                }}
                              >
                                Generate Report
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
