'use client';
import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../utils/api';
import { STATUS_COLORS, ACTIVITY_STATUS } from '../../utils/constants';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';

const ActivityList = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleFiles, setVisibleFiles] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const data = await studentAPI.getActivities(params);
      setActivities(data.activities);
    } catch (error) {
      console.error('Activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId, activityTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${activityTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingId(activityId);
    try {
      await studentAPI.deleteActivity(activityId);
      alert('✅ Activity deleted successfully!');
      fetchActivities();
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Failed to delete activity. ' + (error.message || 'Please try again.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (activity) => {
    setEditingActivity(activity);
    setEditFormData({
      title: activity.title,
      type: activity.type,
      description: activity.description || '',
      date: activity.date ? activity.date.split('T')[0] : '',
      duration: activity.duration || '',
      organizer: activity.organizer || '',
      certificate: null
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', editFormData.title);
      formData.append('type', editFormData.type);
      formData.append('description', editFormData.description);
      formData.append('date', editFormData.date);
      formData.append('duration', editFormData.duration);
      formData.append('organizer', editFormData.organizer);
      
      if (editFormData.certificate) {
        formData.append('certificate', editFormData.certificate);
      }

      await studentAPI.updateActivity(editingActivity.id, formData);
      alert('✅ Activity updated successfully!');
      setEditingActivity(null);
      fetchActivities();
    } catch (error) {
      console.error('Update error:', error);
      alert('❌ Failed to update activity. ' + (error.message || 'Please try again.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.organizer && activity.organizer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = status => {
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

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toggleFileVisibility = activityId => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">My Activities</h1>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>

            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            >
              <option value="all">All Status</option>
              <option value={ACTIVITY_STATUS.PENDING}>Pending</option>
              <option value={ACTIVITY_STATUS.APPROVED}>Approved</option>
              <option value={ACTIVITY_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getStatusIcon(activity.status)}
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0">
                        {activity.title}
                      </h3>
                      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[activity.status] || 'text-gray-600 bg-gray-100'}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {activity.type.replace('_', ' ').charAt(0).toUpperCase() + activity.type.replace('_', ' ').slice(1)}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8V9m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        {activity.credits} credits
                      </div>
                    </div>

                    <div>
                      {activity.organizer && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">Organizer:</span> {activity.organizer}
                        </p>
                      )}
                      {activity.duration && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">Duration:</span> {activity.duration}
                        </p>
                      )}
                      {activity.description && (
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-4">{activity.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between shrink-0 w-full lg:w-44 text-xs sm:text-sm space-y-3 sm:space-y-4">
                    <div className="text-gray-600 dark:text-gray-400">
                      <p>
                        <span className="font-semibold">Submitted:</span> {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      {activity.approver && (
                        <p>
                          <span className="font-semibold">Reviewed by:</span> {activity.approver.name}
                        </p>
                      )}
                    </div>

                    {activity.remarks && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-2.5 sm:p-3 transition-colors">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1 text-xs sm:text-sm">Faculty Remarks</p>
                        <p className="text-yellow-700 dark:text-yellow-400 text-xs sm:text-sm">{activity.remarks}</p>
                      </div>
                    )}

                    {activity.status === ACTIVITY_STATUS.PENDING && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(activity)}
                          disabled={deletingId === activity.id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(activity.id, activity.title)}
                          disabled={deletingId === activity.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === activity.id ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-1" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {activity.filePath && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleFileVisibility(activity.id)}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                        >
                          {visibleFiles[activity.id] ? 'Hide Attachment' : 'View Attachment'}
                        </button>
                        {visibleFiles[activity.id] && (() => {
                          // fileUrl: absolute for Cloudinary, relative for local /uploads/...
                          const fileUrl = activity.filePath;
                          const isCloudinary = fileUrl.startsWith('http') && fileUrl.includes('res.cloudinary.com');
                          const isPDF = fileUrl?.toLowerCase().includes('.pdf');

                          // proxyUrl must be absolute so the PDF.js viewer (on mozilla CDN) can fetch it
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const proxyUrl = `${origin}/api/files/view?url=${encodeURIComponent(fileUrl)}`;

                          let viewUrl;
                          if (isPDF) {
                            // All PDFs go through the proxy + PDF.js viewer
                            viewUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(proxyUrl)}`;
                          } else if (isCloudinary) {
                            // Cloudinary images: open the URL directly
                            viewUrl = fileUrl;
                          } else {
                            // Local images: use the proxy to serve them
                            viewUrl = proxyUrl;
                          }

                          const downloadUrl = isCloudinary
                            ? `/api/files/download?url=${encodeURIComponent(fileUrl)}`
                            : `/api/files/download?url=${encodeURIComponent(fileUrl)}`;

                          return (
                            <div className="mt-2 flex flex-col sm:flex-row gap-2">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </a>
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filter !== 'all' ? 'No matching activities' : 'No activities yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start building your portfolio by submitting your first activity.'}
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 transition-colors">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Activity</h2>
                <button
                  onClick={() => setEditingActivity(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="">Select Type</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="certification">Certification</option>
                    <option value="competition">Competition</option>
                    <option value="internship">Internship</option>
                    <option value="leadership">Leadership</option>
                    <option value="community_service">Community Service</option>
                    <option value="club_activity">Club Activity</option>
                    <option value="online_course">Online Course</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                    <input
                      type="text"
                      value={editFormData.duration}
                      onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                      placeholder="e.g., 2 days"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organizer</label>
                  <input
                    type="text"
                    value={editFormData.organizer}
                    onChange={(e) => setEditFormData({ ...editFormData, organizer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Update Certificate (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setEditFormData({ ...editFormData, certificate: e.target.files[0] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to keep current certificate</p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingActivity(null)}
                    disabled={editSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 text-sm sm:text-base transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base transition-colors"
                  >
                    {editSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Activity'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityList;
