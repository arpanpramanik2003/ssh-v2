'use client';
import React, { useState, useEffect } from 'react';
import { facultyAPI } from '../../utils/api';
import { STATUS_COLORS } from '../../utils/constants';
import { PROGRAM_CATEGORIES } from '../../utils/programsData';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';

const ReviewQueue = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [visibleFiles, setVisibleFiles] = useState({}); // For toggling file visibility

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  const fetchPendingActivities = async () => {
    try {
      const data = await facultyAPI.getPendingActivities();
      setActivities(data.activities);
    } catch (error) {
      console.error('Pending activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (activityId, status, remarks = '', credits = null) => {
    setReviewingId(activityId);
    
    try {
      const reviewData = {
        status,
        remarks,
        ...(status === 'approved' && credits !== null && { credits: parseFloat(credits) })
      };

      await facultyAPI.reviewActivity(activityId, reviewData);
      
      // Remove activity from pending list with animation
      setActivities(activities.filter(activity => activity.id !== activityId));
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setReviewingId(null);
    }
  };

  const handleQuickApprove = (activityId) => {
    const credits = document.getElementById(`credits-${activityId}`).value;
    const remarks = document.getElementById(`remarks-${activityId}`).value;
    handleReview(activityId, 'approved', remarks, credits);
  };

  const handleQuickReject = (activityId) => {
    const remarks = document.getElementById(`remarks-${activityId}`).value || '';
    handleReview(activityId, 'rejected', remarks);
  };

  // ðŸ”¥ Toggle file visibility function
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
          <LoadingSpinner size="md" text="Loading review queue..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-900 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-5 lg:p-6 text-white border border-blue-400 dark:border-blue-700/50 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon Badge */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold leading-tight">
                Review Queue
              </h1>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                {activities.length} {activities.length === 1 ? 'activity' : 'activities'} pending
              </p>
              {user.programCategory && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded px-2.5 py-1 text-xs">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <span className="font-medium truncate">{PROGRAM_CATEGORIES[user.programCategory]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {activities.length > 0 ? (
        <div className="space-y-6">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow hover:shadow-lg dark:shadow-md dark:hover:shadow-lg p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300"
            >
              <div className="space-y-3 sm:space-y-4">
                {/* Activity Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {activity.title}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {[
                        {
                          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                          content: (
                            <div>
                              <p className="font-medium">{activity.student?.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{activity.student?.studentId}</p>
                            </div>
                          )
                        },
                        {
                          icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                          content: (
                            <div>
                              <p className="font-medium">{activity.student?.program || activity.student?.department}</p>
                              {activity.student?.specialization && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">{activity.student.specialization}</p>
                              )}
                            </div>
                          )
                        },
                        {
                          icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                          content: (
                            <div>
                              <p className="font-medium">Year {activity.student?.year}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{activity.student?.department}</p>
                            </div>
                          )
                        },
                        {
                          icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
                          content: activity.type.replace('_', ' ').charAt(0).toUpperCase() + activity.type.replace('_', ' ').slice(1)
                        },
                        {
                          icon: "M8 7V3a4 4 0 118 0v4m-4 8V9m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                          content: new Date(activity.date).toLocaleDateString()
                        }
                      ].map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                          {item.content}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 whitespace-nowrap">
                      Pending Review
                    </span>
                  </div>
                </div>

                {/* Activity Details */}
                <div className="space-y-2 sm:space-y-3 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-700">
                  {activity.organizer && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Organizer:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{activity.organizer}</span>
                    </div>
                  )}
                  
                  {activity.duration && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{activity.duration}</span>
                    </div>
                  )}
                  
                  {activity.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-1 sm:space-y-0">
                      <span className="text-xs">Submitted: {new Date(activity.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs">Credits requested: {activity.credits}</span>
                    </div>
                    
                    {/* View Attachment Button */}
                    {activity.filePath && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleFileVisibility(activity.id)}
                          className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-all duration-200 hover:shadow-md"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {visibleFiles[activity.id] ? 'Hide' : 'View'} Certificate
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Certificate Download Link */}
                  {activity.filePath && visibleFiles[activity.id] && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Certificate Document</span>
                        </div>
                        {(() => {
                          // Keep local paths as-is (/uploads/...); keep Cloudinary URLs absolute
                          const fileUrl = activity.filePath.startsWith('http')
                            ? activity.filePath
                            : activity.filePath;
                          const isPDF = activity.filePath?.toLowerCase().includes('.pdf');

                          // proxyUrl must be absolute so PDF.js viewer (on mozilla CDN) can fetch it
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const proxyUrl = `${origin}/api/files/view?url=${encodeURIComponent(fileUrl)}`;
                          const viewUrl = isPDF
                            ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(proxyUrl)}`
                            : fileUrl; // images open directly
                          const downloadUrl = `/api/files/download?url=${encodeURIComponent(fileUrl)}`;

                          return (
                            <div className="flex space-x-2">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-md"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </a>
                              <a
                                href={downloadUrl}
                                className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-all duration-200 hover:shadow-md"
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

                {/* Review Form with Gradient Background */}
                <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 dark:from-gray-700/50 dark:via-blue-900/20 dark:to-green-900/20 rounded-lg p-3 sm:p-4 lg:p-5 border border-gray-200 dark:border-gray-700 transition-colors mt-3 sm:mt-4">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-600 dark:bg-green-500 rounded-full mr-2"></span>
                    Review Activity
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <label htmlFor={`credits-${activity.id}`} className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Credits (Max: 10)
                      </label>
                      <input
                        type="number"
                        id={`credits-${activity.id}`}
                        min="0"
                        max="10"
                        step="0.1"
                        defaultValue={activity.credits > 10 ? 10 : activity.credits}
                        className="block w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0-10"
                        onInput={(e) => {
                          if (parseFloat(e.target.value) > 10) {
                            e.target.value = 10;
                          }
                        }}
                      />
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <svg className="w-3 h-3 mr-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Req: {activity.credits > 10 ? '10' : activity.credits}
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor={`remarks-${activity.id}`} className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        id={`remarks-${activity.id}`}
                        className="block w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add feedback"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                    <button
                      onClick={() => handleQuickReject(activity.id)}
                      disabled={reviewingId === activity.id}
                      className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 border border-red-300 dark:border-red-700 rounded text-xs sm:text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 transition-all duration-200"
                    >
                      {reviewingId === activity.id ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {reviewingId === activity.id ? 'Rejecting...' : 'Reject'}
                    </button>
                    
                    <button
                      onClick={() => handleQuickApprove(activity.id)}
                      disabled={reviewingId === activity.id}
                      className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent rounded text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 transition-all duration-200"
                    >
                      {reviewingId === activity.id ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {reviewingId === activity.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
              All Caught Up!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              No pending activities to review at the moment.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
              New submissions will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;



