/* eslint-disable */
import { NextResponse } from 'next/server';
import defaultSettings from '@/config/defaultSettings.json';

/**
 * GET handler for dashboard data
 * Returns dashboard statistics and data
 */
export async function GET() {
  try {
    // In a real application, this would fetch from a database
    // For now, we'll generate mock data based on the configuration
    
    // Get crime types from settings
    const crimeTypes = defaultSettings.crimeTypes;
    
    // Generate dashboard data
    const dashboardData = {
      stats: [
        {
          id: 1,
          name: 'Active Investigations',
          value: Math.floor(Math.random() * 30) + 15, // Random between 15-45
          change: Math.floor(Math.random() * 20) - 5, // Random between -5 and 15
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          icon: 'ChartBarIcon',
          clickable: true,
        },
        {
          id: 2,
          name: 'Crimes Reported',
          value: Math.floor(Math.random() * 40) + 20, // Random between 20-60
          change: Math.floor(Math.random() * 20) - 5, // Random between -5 and 15
          changeType: Math.random() > 0.5 ? 'increase' : 'decrease',
          icon: 'DocumentTextIcon',
          clickable: true,
        },
      ],
      caseTrends: [
        { id: 1, name: 'Solving', count: Math.floor(Math.random() * 15) + 5, color: 'bg-green-100 text-green-800' },
        { id: 2, name: 'Losing', count: Math.floor(Math.random() * 10) + 1, color: 'bg-red-100 text-red-800' },
        { id: 3, name: 'Dormant', count: Math.floor(Math.random() * 10) + 1, color: 'bg-gray-100 text-gray-800' },
      ],
      crimeCategories: crimeTypes.map((type: any, index: number) => ({
        id: index + 1,
        name: type.name,
        count: Math.floor(Math.random() * 20) + 1, // Random between 1-20
        color: type.color
      })),
      recentActivity: [
        {
          id: 1,
          action: 'New theft case reported',
          timestamp: '2 hours ago',
          user: 'System',
        },
        {
          id: 2,
          action: 'Updated investigation #1234',
          timestamp: '4 hours ago',
          user: 'John Doe',
        },
        {
          id: 3,
          action: 'Added evidence to case #5678',
          timestamp: '6 hours ago',
          user: 'Jane Smith',
        },
        {
          id: 4,
          action: 'Closed investigation #9012',
          timestamp: '1 day ago',
          user: 'Mike Johnson',
        },
        {
          id: 5,
          action: 'New accident case reported',
          timestamp: '1 day ago',
          user: 'System',
        },
      ],
      priorityCases: [
        {
          id: 'CASE-1234',
          type: 'Theft',
          priority: 'High',
          assignedTo: 'John Doe',
          status: 'In Progress',
          lastUpdated: '2 hours ago',
        },
        {
          id: 'CASE-5678',
          type: 'Chain Snatching',
          priority: 'High',
          assignedTo: 'Jane Smith',
          status: 'Open',
          lastUpdated: '1 day ago',
        },
        {
          id: 'CASE-9012',
          type: 'Murder',
          priority: 'Medium',
          assignedTo: 'Mike Johnson',
          status: 'In Progress',
          lastUpdated: '3 days ago',
        },
        {
          id: 'CASE-3456',
          type: 'Accident',
          priority: 'Medium',
          assignedTo: 'Unassigned',
          status: 'Open',
          lastUpdated: '5 days ago',
        },
      ],
    };
    
    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to generate dashboard data' },
      { status: 500 }
    );
  }
}
