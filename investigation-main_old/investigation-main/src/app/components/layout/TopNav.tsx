'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const TopNav = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        <div className="relative">
          <button
            className="relative rounded-full p-1 hover:bg-gray-100"
            aria-label="Notifications"
          >
            <BellIcon className="h-6 w-6 text-gray-500" />
            <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              3
            </span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 rounded-full text-sm focus:outline-none"
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <div className="flex items-center">
              <span className="sr-only">Open user menu</span>
              {user?.avatar ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-blue-600">
                  <Image
                    className="object-cover"
                    src={user.avatar}
                    alt={user.name}
                    fill
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                  {user?.name.charAt(0)}
                </div>
              )}
              <div className="ml-2 hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="font-semibold">{user?.badgeNumber}</span>
                  <span className="mx-1">•</span>
                  <span>{user?.department}</span>
                </div>
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center">
                  {user?.avatar && (
                    <div className="relative mr-3 h-12 w-12 overflow-hidden rounded-full border-2 border-blue-600">
                      <Image
                        className="object-cover"
                        src={user.avatar}
                        alt={user.name}
                        fill
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <span className="font-semibold">{user?.badgeNumber}</span>
                      <span className="mx-1">•</span>
                      <span>{user?.department}</span>
                    </div>
                  </div>
                </div>
              </div>
              <a
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCircleIcon className="mr-2 h-5 w-5" />
                Your Profile
              </a>
              <a
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Cog6ToothIcon className="mr-2 h-5 w-5" />
                Settings
              </a>
              <button
                onClick={logout}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
