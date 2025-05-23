'use client';

import React from 'react';
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    {children}
  </p>
);

export default function ComingSoonPage() {
  const features = {
    tier1: [
      'Multi-Crime Pattern Detection',
      'Geo-Crime Heatmaps & Movement Tracking',
      'Advanced Report Generation',
      'Real-time Alerts & Crime Forecasting',
    ],
    tier2: [
      'Evidence Correlation & Tagging',
      'Smart Crime Linking Engine',
      'Private On-Premise or National Cloud Deployment (Optional Add-on)',
      'Integration with National Crime Databases (Optional Add-on)',
    ],
  };

  const pricing = [
    {
      title: 'Subscription Plans',
      description: 'Monthly or Annual Subscription',
      details: 'Ideal for agencies wanting full access to AI intelligence & analytics tools.',
    },
    {
      title: 'Customization Fee',
      description: 'Tailored workflows & integrations',
      details: 'Custom workflows, regional crime types, or integrations with internal systems.',
    },
    {
      title: 'API Access',
      description: 'Secure and scalable integration',
      details: 'Tiered pricing for integration into government systems, dashboards, or third-party tools.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>
        <p className="text-xl text-muted-foreground">Premium Access to Advanced Crime Analysis Tools</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Tier 1 Card */}
        <Card className="border-2 border-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-purple-50 dark:bg-purple-900/20 rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Tier 1: Advanced Intelligence Suite</CardTitle>
              {/* <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                For Mid-Sized Departments
              </span> */}
            </div>
            <CardDescription>Smart crime solving and data-driven insights</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {features.tier1.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
            Coming Soon
            </Button>
          </CardFooter>
        </Card>

        {/* Tier 2 Card */}
        <Card className="border-2 border-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-purple-50 dark:bg-purple-900/20 rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Tier 2: Tactical CrimeOps Suite</CardTitle>
              {/* <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
                For Large Agencies
              </span> */}
            </div>
            <CardDescription>Deep forensic insights and inter-agency intelligence</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {features.tier2.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
            Coming Soon
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Pricing Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Pricing Options</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {pricing.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-2">{item.description}</p>
                <p className="text-sm text-muted-foreground">{item.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
