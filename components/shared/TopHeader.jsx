'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE_URL } from '../../utils/constants';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserDepartmentLikeDisplay } from '../../utils/userDisplay';

const TopHeader = ({ user, onLogout, isSidebarCollapsed = false }) => {
  const departmentLikeDisplay = getUserDepartmentLikeDisplay(user);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const backendBaseUrl = API_BASE_URL.replace('/api', '');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setIsProfileMenuOpen(false);
    if (isProfileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileMenuOpen]);

  const getProfileImage = (profilePicture) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') ? profilePicture : `${backendBaseUrl}${profilePicture}`;
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  const profileImageUrl = getProfileImage(user?.profilePicture);

  return (
    <header className={`fixed top-0 right-0 left-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-30 transition-all duration-300 ${
      isSidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
    } left-0`}>
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex-1 lg:ml-0 ml-14">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 hidden sm:block">
            Welcome back, <span className="text-blue-600 dark:text-blue-400">{user.name.split(' ')[0]}</span>! 👋
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
            {departmentLikeDisplay} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Online Status */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); }}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  unoptimized
                />
              ) : null}
              <div
                className={`w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-600 ${profileImageUrl ? 'hidden' : 'flex'}`}
              >
                {getInitials(user.name)}
              </div>
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Profile Header */}
                <div className="bg-indigo-600 px-4 py-4">
                  <div className="flex items-center space-x-3">
                    {profileImageUrl ? (
                      <Image src={profileImageUrl} alt={user.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover border-2 border-white" unoptimized />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-white">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-xs text-indigo-100 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={toggleTheme}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isDarkMode ? (
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} relative transition-colors`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                    </div>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                  <button
                    onClick={() => { onLogout(); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
