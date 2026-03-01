'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { facultyAPI } from '../../utils/api';
import { STATUS_COLORS } from '../../utils/constants';
import { PROGRAM_CATEGORIES } from '../../utils/programsData';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const Dashboard = ({ user, token, onNavigate }) => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await facultyAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Faculty stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ðŸ”¥ Navigation handlers for Quick Actions
  const handleReviewPending = () => {
    router.push('/faculty/review');
  };

  const handleViewAllActivities = () => {
    router.push('/faculty/activities');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <CardSkeleton cards={3} />
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-blue-600 dark:bg-blue-900 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-5 lg:p-8 text-white border border-blue-400 dark:border-blue-700/50 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-3xl font-bold mb-2 flex flex-wrap items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              <span className="break-words">Welcome, Prof. {user.name}!</span>
            </h1>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm text-blue-100 flex flex-wrap items-center gap-1 sm:gap-1.5">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{user.department}</span>
                <span className="text-blue-200">•</span>
                <span className="text-blue-100">Faculty Dashboard</span>
              </p>
              {user.programCategory && (
                <p className="text-xs text-blue-200 flex flex-wrap items-center gap-1 sm:gap-1.5">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <span>Program Category: {PROGRAM_CATEGORIES[user.programCategory]}</span>
                </p>
              )}
            </div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-2 text-right flex-shrink-0">
            <div className="text-xs text-blue-100">Active Session</div>
            <div className="text-sm font-semibold whitespace-nowrap">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
        {[
          {
            value: stats?.pendingCount || 0,
            label: "Pending Review",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "bg-yellow-500 dark:bg-yellow-600"
          },
          {
            value: stats?.totalActivities || 0,
            label: "Total Activities",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            color: "bg-blue-500 dark:bg-blue-600"
          },
          {
            value: stats?.approvedCount || 0,
            label: "Approved",
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "bg-green-500 dark:bg-green-600"
          },
          {
            value: stats?.rejectedCount || 0,
            label: "Rejected",
            icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "bg-red-500 dark:bg-red-600"
          },
          {
            value: stats?.reviewedByMe || 0,
            label: "Reviewed by Me",
            icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
            color: "bg-purple-500 dark:bg-purple-600"
          }
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
          >
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className={`p-2 sm:p-3 rounded-lg ${stat.color} shadow-md`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{stat.value}</h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 font-medium line-clamp-2">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reviews */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100">Recent Reviews</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Latest evaluations</p>
          </div>
        </div>
        <div className="p-3 sm:p-6">
          {stats?.recentReviews?.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {stats.recentReviews.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-600 gap-2 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{activity.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {activity.student?.name} • {activity.student?.department}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      {activity.type.replace('_', ' ')} • {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg shadow-sm whitespace-nowrap">
                      {activity.credits} credits
                    </span>
                    <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[activity.status] || 'text-gray-600 bg-gray-100'} shadow-sm whitespace-nowrap`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">No recent reviews</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reviews will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100">Quick Actions</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Key areas</p>
          </div>
        </div>
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            {/* Review Pending Activities */}
            <button 
              className="flex items-center gap-3 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:shadow-md hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-200 text-left group active:scale-95"
              onClick={handleReviewPending}
            >
              <div className="p-2 bg-yellow-500 dark:bg-yellow-600 rounded-lg shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Review Pending Activities</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{stats?.pendingCount || 0} awaiting review</p>
              </div>
            </button>
            
            {/* View All Activities */}
            <button 
              className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-left group active:scale-95"
              onClick={handleViewAllActivities}
            >
              <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">View All Activities</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Browse submissions</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

