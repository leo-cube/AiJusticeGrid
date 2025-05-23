/* eslint-disable */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Logo from '@/app/components/ui/Logo';
import {
  HomeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    title: 'Crime',
    href: '/crime',
    icon: <ChartBarIcon className="h-5 w-5" />,
  },
  {
    title: 'Assignments',
    href: '/assignments',
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  // DegreeGuru and Chat entries removed
  {
    title: 'Reports',
    href: '/reports',
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <CogIcon className="h-5 w-5" />,
  },
];

const Sidebar = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && <Logo />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {!collapsed && user && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200">
              {user.avatar ? (
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    className="object-cover"
                    fill
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-600 text-white">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.badgeNumber}</p>
              <p className="text-xs text-gray-500">{user.department}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Police Investigation System</p>
              <p className="text-xs text-gray-400">v1.0.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
