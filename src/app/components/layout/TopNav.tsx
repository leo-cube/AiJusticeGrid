'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const TopNav = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-500 px-6 shadow-md">
      <div className="flex items-center">
        <div className="relative flex-shrink-0">
          {/* <Logo size="sm" /> */}
        </div>
      </div>

      <div className="flex items-center space-x-6 text-white">
        <div className="hidden md:flex items-center space-x-4">
          {/* MagnifyingGlassIcon removed */}
          <div className="relative">
            <button className="p-1.5 rounded-full hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
              <BellIcon className="h-5 w-5 text-white" />
              <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </button>
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="flex items-center space-x-3 rounded-full p-1 pr-3 hover:bg-indigo-500 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="relative h-9 w-9 rounded-full bg-white text-indigo-700 flex items-center justify-center text-sm font-semibold shadow-inner">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left text-white">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <div className="flex items-center text-xs font-medium">
                  <span className="bg-white text-indigo-700 px-2 py-0.5 rounded-full">
                    {user?.badgeNumber || 'ID12345'}
                  </span>
                  <span className="mx-1.5 text-white">•</span>
                  <span>{user?.department || 'Department'}</span>
                </div>
              </div>
              <ChevronDownIcon
                className={`ml-1 h-4 w-4 text-white transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                </div>
                <a
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                  Your Profile
                </a>
                <a
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                  Settings
                </a>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={logout}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
