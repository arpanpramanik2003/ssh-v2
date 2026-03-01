'use client';
import React, { useState, useEffect } from 'react';
import { facultyAPI } from '../../utils/api';
import { STATUS_COLORS, ACTIVITY_STATUS } from '../../utils/constants';
import { PROGRAM_CATEGORIES } from '../../utils/programsData';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';

const AllActivities = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleFiles, setVisibleFiles] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAllActivities();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortBy]);

  const fetchAllActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      
      const data = await facultyAPI.getAllActivities(params);
      
      // Sort activities
      let sortedActivities = [...(data.activities || [])];
      switch (sortBy) {
        case 'newest':
          sortedActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          sortedActivities.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'student':
          sortedActivities.sort((a, b) => a.student?.name.localeCompare(b.student?.name));
          break;
        case 'credits':
          sortedActivities.sort((a, b) => b.credits - a.credits);
          break;
      }
      
      setActivities(sortedActivities);
    } catch (error) {
      console.error('All activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await facultyAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.student?.name && activity.student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activity.student?.studentId && activity.student.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activity.organizer && activity.organizer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case ACTIVITY_STATUS.APPROVED:
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case ACTIVITY_STATUS.PENDING:
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case ACTIVITY_STATUS.REJECTED:
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const toggleFileVisibility = (activityId) => {
    setVisibleFiles(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionSkeleton rows={4} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading activities..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Stats */}
      <div className="bg-blue-600 dark:bg-blue-900 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-5 lg:p-6 border border-blue-400 dark:border-blue-700/50 transition-colors">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">All Activities</h1>
            </div>
            <p className="text-sm sm:text-base text-blue-100 dark:text-blue-200 ml-11 sm:ml-13 transition-colors">
              Overview of all student activity submissions
            </p>
            {user.programCategory && (
              <div className="mt-2 ml-11 sm:ml-13 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <span className="font-medium">Showing only: {PROGRAM_CATEGORIES[user.programCategory]}</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-6 sm:flex sm:space-x-6 text-xs sm:text-sm">
            <div className="text-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg px-2 sm:px-4 py-2 sm:py-3 transition-colors">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {stats?.totalActivities || 0}
              </div>
              <div className="text-blue-100 dark:text-blue-200 transition-colors text-xs">Total</div>
            </div>
            <div className="text-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg px-2 sm:px-4 py-2 sm:py-3 transition-colors">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {stats?.pendingCount || 0}
              </div>
              <div className="text-blue-100 dark:text-blue-200 transition-colors text-xs">Pending</div>
            </div>
            <div className="text-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg px-2 sm:px-4 py-2 sm:py-3 transition-colors">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {stats?.approvedCount || 0}
              </div>
              <div className="text-blue-100 dark:text-blue-200 transition-colors text-xs">Approved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 transition-colors">
        <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
          {/* Search */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg 
                className="h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 lg:gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400"
            >
              <option value="all">All Status</option>
              <option value={ACTIVITY_STATUS.PENDING}>Pending</option>
              <option value={ACTIVITY_STATUS.APPROVED}>Approved</option>
              <option value={ACTIVITY_STATUS.REJECTED}>Rejected</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="student">By Student Name</option>
              <option value="credits">By Credits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredActivities.map((activity, index) => (
            <div 
              key={activity.id} 
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow hover:shadow-lg dark:shadow-md dark:hover:shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700"
            >
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Activity Header */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {getStatusIcon(activity.status)}
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate transition-colors flex-1 min-w-0">
                        {activity.title}
                      </h3>
                      <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[activity.status] || 'text-gray-600 bg-gray-100'}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex flex-col gap-1.5 sm:gap-2 lg:gap-3 sm:flex-row mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors flex-wrap">
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium truncate">{activity.student?.name}</span>
                        <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">({activity.student?.studentId})</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="truncate">
                          {activity.student?.program || activity.student?.department}
                          {activity.student?.specialization && ` (${activity.student.specialization})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="truncate">Year {activity.student?.year}</span>
                      </div>
                    </div>

                    {/* Activity Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 lg:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 transition-colors">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="truncate">{activity.type.replace('_', ' ').charAt(0).toUpperCase() + activity.type.replace('_', ' ').slice(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8V9m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span>{activity.credits} credits</span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(activity.organizer || activity.description) && (
                      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                        {activity.organizer && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors">
                            <span className="font-medium">Organizer:</span> {activity.organizer}
                          </p>
                        )}
                        {activity.description && (
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 transition-colors">{activity.description}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-2 sm:pt-0 sm:border-t sm:border-gray-200 sm:dark:border-gray-700 sm:mt-3">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors font-medium">Submitted</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">{new Date(activity.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      {activity.approver && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors font-medium">Reviewed by</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">{activity.approver.name}</p>
                        </div>
                      )}
                    </div>

                    {activity.remarks && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded p-1.5 sm:p-2 transition-all duration-200">
                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-0.5 transition-colors">Remarks</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 transition-colors line-clamp-1">{activity.remarks}</p>
                      </div>
                    )}

                    {/* View Attachment Button */}
                    {activity.filePath && (
                      <button
                        type="button"
                        onClick={() => toggleFileVisibility(activity.id)}
                        className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-all duration-200 active:scale-95 flex-shrink-0 whitespace-nowrap"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {visibleFiles[activity.id] ? 'Hide' : 'View'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Certificate View */}
                {activity.filePath && visibleFiles[activity.id] && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 transition-colors">Certificate</span>
                      </div>
                      {(() => {
                        const fileUrl = activity.filePath.startsWith('http') ? activity.filePath : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${activity.filePath}`;
                        const isPDF = fileUrl.toLowerCase().includes('.pdf');
                        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileUrl);
                        
                        const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/files/view?url=${encodeURIComponent(fileUrl)}`;
                        const viewUrl = isPDF 
                          ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(proxyUrl)}` 
                          : fileUrl;
                        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/files/download?url=${encodeURIComponent(fileUrl)}`;
                        
                        return (
                          <div className="flex gap-1.5 sm:gap-2">
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-all duration-200 active:scale-95 flex-shrink-0 whitespace-nowrap"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </a>
                            <a
                              href={downloadUrl}
                              className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-all duration-200 active:scale-95 flex-shrink-0 whitespace-nowrap"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="text-center py-6 sm:py-10 lg:py-12 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 transition-colors">
              No activities found
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No student activities have been submitted yet.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllActivities;



