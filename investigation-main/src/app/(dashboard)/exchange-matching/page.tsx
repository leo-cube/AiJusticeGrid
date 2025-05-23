'use client';

import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

// Mock exchange match data
const exchangeMatches = [
  {
    id: 'EM-3001',
    exchange1: 'Global Exchange A',
    exchange2: 'Offshore Exchange B',
    mismatchType: 'Transaction Volume Discrepancy',
    severityScore: 92,
    date: '2025-05-10',
    detectionMethod: 'Automated Pattern Analysis',
    status: 'detected',
    details: {
      description: 'Significant discrepancy in reported transaction volumes between exchanges. Global Exchange A reported $15M in transactions while Offshore Exchange B reported only $8M for the same trading pairs.',
      recommendations: [
        'Investigate transaction records from both exchanges',
        'Identify missing transactions',
        'Check for potential money laundering activity'
      ],
      relatedEntities: ['Trading Group X', 'Offshore Company Y']
    }
  },
  {
    id: 'EM-3002',
    exchange1: 'Crypto Exchange C',
    exchange2: 'Banking Network D',
    mismatchType: 'Currency Conversion Anomaly',
    severityScore: 85,
    date: '2025-05-08',
    detectionMethod: 'Manual Audit',
    status: 'investigating',
    details: {
      description: 'Unusual currency conversion rates applied to transactions between Crypto Exchange C and Banking Network D. Conversion rates deviate significantly from market rates, potentially indicating manipulation or money laundering.',
      recommendations: [
        'Analyze conversion rate patterns',
        'Compare with market rates',
        'Identify beneficiaries of the rate discrepancies'
      ],
      relatedEntities: ['Currency Trader Z', 'Financial Group Alpha']
    }
  },
  {
    id: 'EM-3003',
    exchange1: 'Stock Exchange E',
    exchange2: 'Commodity Exchange F',
    mismatchType: 'Timing Discrepancy',
    severityScore: 78,
    date: '2025-05-05',
    detectionMethod: 'Whistleblower',
    status: 'investigating',
    details: {
      description: 'Suspicious timing patterns in related transactions across Stock Exchange E and Commodity Exchange F. Transactions appear to be timed to take advantage of market movements before public announcements.',
      recommendations: [
        'Analyze transaction timing patterns',
        'Correlate with market announcements',
        'Identify potential insider trading'
      ],
      relatedEntities: ['Trading Firm Beta', 'Investment Group Gamma']
    }
  },
  {
    id: 'EM-3004',
    exchange1: 'International Exchange G',
    exchange2: 'Local Exchange H',
    mismatchType: 'Identity Mismatch',
    severityScore: 95,
    date: '2025-05-03',
    detectionMethod: 'AI Detection System',
    status: 'detected',
    details: {
      description: 'Different identities used for the same transactions across exchanges. Transactions on International Exchange G were conducted under corporate entities while matching transactions on Local Exchange H were under individual names.',
      recommendations: [
        'Verify identities on both exchanges',
        'Trace beneficial ownership',
        'Check for shell companies'
      ],
      relatedEntities: ['Offshore Trust Delta', 'Individual Trader John Doe']
    }
  },
  {
    id: 'EM-3005',
    exchange1: 'Forex Exchange I',
    exchange2: 'Crypto Exchange J',
    mismatchType: 'Value Discrepancy',
    severityScore: 88,
    date: '2025-04-30',
    detectionMethod: 'Regulatory Report',
    status: 'resolved',
    details: {
      description: 'Significant value differences in cross-exchange transactions between Forex Exchange I and Crypto Exchange J. Values reported on crypto side were consistently 15-20% higher than forex side.',
      recommendations: [
        'Audit transaction values',
        'Check for unreported fees or commissions',
        'Investigate potential tax evasion'
      ],
      relatedEntities: ['Trading Company Epsilon', 'Offshore Entity Zeta']
    }
  }
];

export default function ExchangeMatchingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const filteredMatches = exchangeMatches.filter(match =>
    match.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.exchange1.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.exchange2.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.mismatchType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMatchClick = (matchId: string) => {
    setSelectedMatch(matchId === selectedMatch ? null : matchId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Matching</h1>
          <p className="text-gray-500">Detect and investigate exchange mismatches</p>
        </div>
        <Button onClick={() => {
          alert('New Exchange Matching Analysis form would open here');
          // In a real application, this would open a modal or navigate to a form
        }}>New Analysis</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Mismatches</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">12</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-red-500" />
              <span className="ml-1 text-sm font-medium text-red-500">8.5%</span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Severity</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">87.6</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <ArrowsRightLeftIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-yellow-500" />
              <span className="ml-1 text-sm font-medium text-yellow-500">3.2%</span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved Cases</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">5</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              <span className="ml-1 text-sm font-medium text-green-500">12.1%</span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exchange Mismatches</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search exchange mismatches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              className="rounded-md border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
              onClick={() => {
                alert('Exchange matching filter options would appear here');
                // In a real application, this would open a filter dropdown
              }}
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Exchange 1</th>
                  <th className="px-4 py-3">Exchange 2</th>
                  <th className="px-4 py-3">Mismatch Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMatches.map((match) => (
                  <React.Fragment key={match.id}>
                    <tr
                      className={`text-sm text-gray-900 ${selectedMatch === match.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => handleMatchClick(match.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{match.id}</td>
                      <td className="whitespace-nowrap px-4 py-3">{new Date(match.date).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-3">{match.exchange1}</td>
                      <td className="whitespace-nowrap px-4 py-3">{match.exchange2}</td>
                      <td className="whitespace-nowrap px-4 py-3">{match.mismatchType}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center">
                          <span className={`mr-2 font-medium ${
                            match.severityScore >= 90 ? 'text-red-600' :
                            match.severityScore >= 70 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>{match.severityScore}</span>
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full ${
                                match.severityScore >= 90 ? 'bg-red-600' :
                                match.severityScore >= 70 ? 'bg-yellow-600' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${match.severityScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            match.status === 'detected'
                              ? 'bg-blue-100 text-blue-800'
                              : match.status === 'investigating'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {match.status === 'detected' ? 'Detected' : match.status === 'investigating' ? 'Investigating' : 'Resolved'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            alert(`View details for mismatch ${match.id}`);
                            // In a real application, this would navigate to a detail page
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                    {selectedMatch === match.id && (
                      <tr>
                        <td colSpan={8} className="bg-blue-50 px-4 py-3">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Detection Method</h4>
                              <p>{match.detectionMethod}</p>
                            </div>

                            <div>
                              <h4 className="font-medium">Description</h4>
                              <p className="mt-1 text-sm">{match.details.description}</p>
                            </div>

                            <div>
                              <h4 className="font-medium">Related Entities</h4>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {match.details.relatedEntities.map((entity, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                                  >
                                    {entity}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium">Recommended Actions</h4>
                              <ul className="mt-1 list-inside list-disc text-sm">
                                {match.details.recommendations.map((recommendation, index) => (
                                  <li key={index}>{recommendation}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  alert(`Starting investigation for mismatch ${match.id}`);
                                  // In a real application, this would start an investigation workflow
                                }}
                              >
                                Investigate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  alert(`Generating report for mismatch ${match.id}`);
                                  // In a real application, this would generate a detailed report
                                }}
                              >
                                Generate Report
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  alert(`Flagging mismatch ${match.id} for review`);
                                  // In a real application, this would flag the case for review
                                }}
                              >
                                Flag for Review
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
