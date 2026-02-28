'use client';
import React from 'react';

const Layout = ({ children, hasSidebar = false, isSidebarCollapsed = false }) => {
  return (
    <main className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 pt-16 ${
      hasSidebar ? (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''
    } ml-0`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </div>
    </main>
  );
};

export default Layout;
