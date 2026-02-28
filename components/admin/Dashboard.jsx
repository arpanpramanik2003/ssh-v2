'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../utils/api';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const AdminDashboard = ({ user, token, onNavigate }) => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await adminAPI.getStats();
      setStats(data);
      setError('');
    } catch (error) {
      console.error('Admin stats fetch error:', error);
      setError(error.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔥 Navigation handlers for Quick Actions
  const handleAddUser = () => {
    router.push('/admin/users');
  };

  const handleGenerateReport = () => {
    router.push('/admin/reports');
  };

  const handleViewAnalytics = () => {
    router.push('/admin/analytics');
  };

  const handleRefreshData = () => {
    fetchStats(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <CardSkeleton cards={4} />
        <div className="flex justify-center py-10">
          <LoadingSpinner size="md" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4 transition-colors">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 transition-colors">Error Loading Dashboard</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300 transition-colors">{error}</p>
            <button 
              onClick={() => fetchStats()}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline focus:outline-none transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  const getPercentage = (part, total) => {
    if (!total || total === 0) return '0.0';
    return ((part / total) * 100).toFixed(1);
  };

  const getActivityApprovalRate = () => {
    const total = stats?.activityStats?.totalActivities || 0;
    const approved = stats?.activityStats?.approvedActivities || 0;
    return total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="space-y-6">
      {/* Error notification banner */}
      {error && stats && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 transition-colors">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 transition-colors">
                Warning: {error}. Data shown may be outdated.
                <button 
                  onClick={() => fetchStats(true)}
                  className="ml-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 underline transition-colors"
                >
                  Refresh now
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-lg shadow-lg p-6 text-white transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-blue-100 dark:text-blue-200 mt-1 transition-colors">System Administrator Dashboard</p>
            <p className="text-blue-200 dark:text-blue-300 text-sm mt-1 transition-colors">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-blue-100 dark:text-blue-200 text-sm transition-colors">Total System Users</div>
            <div className="text-3xl font-bold">{formatNumber(stats?.userStats?.totalUsers)}</div>
            <div className="text-blue-200 dark:text-blue-300 text-xs mt-1 transition-colors">
              {stats?.userStats?.adminCount || 0} admin{(stats?.userStats?.adminCount || 0) !== 1 ? 's' : ''}
            </div>
          </div>
          {refreshing && (
            <div className="absolute top-4 right-4">
              <LoadingSpinner size="sm" className="text-blue-200" />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4 transition-colors">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{formatNumber(stats?.userStats?.studentCount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {getPercentage(stats?.userStats?.studentCount, stats?.userStats?.totalUsers)}% of users
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4 transition-colors">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Faculty</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{formatNumber(stats?.userStats?.facultyCount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {getPercentage(stats?.userStats?.facultyCount, stats?.userStats?.totalUsers)}% of users
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-4 transition-colors">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{formatNumber(stats?.activityStats?.totalActivities)}</p>
              <p className="text-xs text-green-600 dark:text-green-400 transition-colors">
                {getActivityApprovalRate()}% approval rate
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4 transition-colors">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{formatNumber(stats?.activityStats?.pendingActivities)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {stats?.activityStats?.pendingActivities > 0 ? 'Needs attention' : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Activity Status & Program Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center transition-colors">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
            Activity Status Breakdown
          </h3>
          <div className="space-y-4">
            {[
              { 
                status: 'Approved', 
                count: stats?.activityStats?.approvedActivities || 0, 
                color: 'bg-green-500', 
                bgColor: 'bg-green-50 dark:bg-green-900/30',
                textColor: 'text-green-700 dark:text-green-300'
              },
              { 
                status: 'Pending', 
                count: stats?.activityStats?.pendingActivities || 0, 
                color: 'bg-yellow-500 dark:bg-yellow-400', 
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
                textColor: 'text-yellow-700 dark:text-yellow-300'
              },
              { 
                status: 'Rejected', 
                count: stats?.activityStats?.rejectedActivities || 0, 
                color: 'bg-red-500 dark:bg-red-400', 
                bgColor: 'bg-red-50 dark:bg-red-900/30',
                textColor: 'text-red-700 dark:text-red-300'
              }
            ].map((item, index) => {
              const percentage = getPercentage(item.count, stats?.activityStats?.totalActivities);
              return (
                <div key={item.status} className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor} hover:shadow-sm transition-all`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 ${item.color} rounded mr-3`}></div>
                    <span className={`text-sm font-medium ${item.textColor} transition-colors`}>{item.status}</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${item.textColor} transition-colors`}>{formatNumber(item.count)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 bg-gray-200 dark:bg-gray-600 rounded-full h-2 transition-colors">
            <div 
              className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${getPercentage(stats?.activityStats?.approvedActivities, stats?.activityStats?.totalActivities)}%` 
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center transition-colors">
            Overall approval rate: {getActivityApprovalRate()}%
          </p>
        </div>

        {/* Enhanced Program Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center transition-colors">
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full mr-3"></div>
            Program Category Distribution
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats?.programCategoryStats?.slice(0, 10).map((category, index) => {
              const percentage = getPercentage(category.count, stats.userStats.totalUsers);
              const colors = [
                { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', bar: 'bg-blue-500 dark:bg-blue-400' },
                { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', bar: 'bg-green-500 dark:bg-green-400' },
                { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', bar: 'bg-yellow-500 dark:bg-yellow-400' },
                { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', bar: 'bg-red-500 dark:bg-red-400' },
                { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-500 dark:bg-purple-400' },
                { bg: 'bg-pink-50 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', bar: 'bg-pink-500 dark:bg-pink-400' },
                { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', bar: 'bg-indigo-500 dark:bg-indigo-400' },
                { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', bar: 'bg-teal-500 dark:bg-teal-400' },
                { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', bar: 'bg-orange-500 dark:bg-orange-400' },
                { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', bar: 'bg-gray-500 dark:bg-gray-400' }
              ];
              const colorScheme = colors[index] || colors[colors.length - 1];
              
              return (
                <div key={category.programCategory} className={`flex items-center justify-between p-2 rounded ${colorScheme.bg} hover:shadow-sm transition-all`}>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded mr-3 ${colorScheme.bar}`}></div>
                    <span className={`text-sm font-medium truncate ${colorScheme.text} transition-colors`} title={category.programCategory}>
                      {category.programCategory}
                    </span>
                  </div>
                  <div className="text-right ml-2">
                    <div className={`font-semibold text-sm ${colorScheme.text} transition-colors`}>{formatNumber(category.count)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{percentage}%</div>
                  </div>
                </div>
              );
            })}
            {stats?.programCategoryStats?.length > 10 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700 transition-colors">
                +{stats.programCategoryStats.length - 10} more categories
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Top Students */}
      {stats?.topStudents?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center transition-colors">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
              Top Active Students
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Most active participants
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topStudents.slice(0, 6).map((student, index) => (
              <div key={student.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600 dark:text-green-400 transition-colors">{student.totalCredits}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">credits</div>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate transition-colors" title={student.name}>
                    {student.name}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-mono transition-colors">{student.studentId}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate transition-colors" title={student.program}>
                    {student.program ? `${student.program}${student.specialization ? ' - ' + student.specialization : ''}` : student.department || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center transition-colors">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {student.activityCount} activities
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Activity Types */}
      {stats?.activityTypeStats?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center transition-colors">
            <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
            Popular Activity Types
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.activityTypeStats.slice(0, 8).map((type, index) => {
              const colors = [
                'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
                'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
              ];
              const bgColors = [
                'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700', 
                'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700', 
                'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700', 
                'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700',
                'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700', 
                'bg-pink-50 border-pink-200 dark:bg-pink-900/30 dark:border-pink-700', 
                'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700', 
                'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
              ];
              
              return (
                <div key={type.type} className={`text-center p-4 border rounded-lg hover:shadow-md transition-all ${bgColors[index] || bgColors[bgColors.length - 1]}`}>
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${colors[index] || colors[colors.length - 1]}`}>
                    <span className="text-white font-bold text-lg">{type.count}</span>
                  </div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 font-medium capitalize leading-tight transition-colors">
                    {type.type.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center transition-colors">
          <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleAddUser}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Manage Users</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Add, edit, delete users</div>
          </button>
          
          <button 
            onClick={handleGenerateReport}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H4a2 2 0 01-2-2v-1a2 2 0 012-2h1a4 4 0 004-4v-2" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Generate Report</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Export activity data</div>
          </button>
          
          <button 
            onClick={handleViewAnalytics}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">View Analytics</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Detailed insights</div>
          </button>
          
          <button 
            onClick={handleRefreshData}
            disabled={refreshing}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg 
                className={`w-6 h-6 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Update statistics</div>
          </button>
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center transition-colors">
          <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
          System Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <div className="text-sm font-medium text-green-800">Database</div>
              <div className="text-xs text-green-600">Connected</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <div className="text-sm font-medium text-green-800">API Server</div>
              <div className="text-xs text-green-600">Online</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <div className="text-sm font-medium text-green-800">File Storage</div>
              <div className="text-xs text-green-600">Accessible</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

