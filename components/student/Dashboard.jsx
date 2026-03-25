'use client';
import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { studentAPI } from '../../utils/api';
import { STATUS_COLORS, API_BASE_URL } from '../../utils/constants';
import { getStudentProgramDisplay } from '../../utils/userDisplay';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

// Get backend base URL from environment variable (without /api suffix)
const backendBaseUrl = API_BASE_URL.replace('/api', '');

const Dashboard = ({ user, token, updateUser }) => {
  const academicDisplay = getStudentProgramDisplay(user);
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const [profilePreview, setProfilePreview] = useState(() => {
    if (!user?.profilePicture) return '/default-avatar.png';
    return user.profilePicture.startsWith('http') 
      ? user.profilePicture 
      : `${backendBaseUrl}${user.profilePicture}`;
  });

  useEffect(() => {
    if (user?.profilePicture) {
      const url = user.profilePicture.startsWith('http') 
        ? user.profilePicture 
        : `${backendBaseUrl}${user.profilePicture}`;
      setProfilePreview(url);
    } else {
      setProfilePreview('/default-avatar.png');
    }
  }, [user?.profilePicture]);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, activitiesData] = await Promise.all([
        studentAPI.getStats(),
        studentAPI.getActivities({ limit: 5 })
      ]);
      setStats(statsData);
      setRecentActivities(activitiesData.activities);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    const file = e.target.avatar.files[0];
    if (!file) return;
    
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const res = await fetch(`${API_BASE_URL}/students/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (data.profilePicture) {
        const newProfileUrl = data.profilePicture.startsWith('http') 
          ? data.profilePicture 
          : `${backendBaseUrl}${data.profilePicture}`;
        setProfilePreview(newProfileUrl);
        
        if (typeof updateUser === 'function') {
          updateUser({ ...user, profilePicture: data.profilePicture });
        }
        
        e.target.reset();
        alert('Profile picture updated successfully!');
      } else {
        alert('Photo upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Photo upload error!');
    }
    
    setAvatarUploading(false);
  };

  const formatStat = (val) => (isPending || loading ? '...' : val ?? 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <CardSkeleton cards={4} />
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-indigo-600 text-white rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4"
      >
        <Image
          src={profilePreview}
          alt="Profile"
          width={96}
          height={96}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-blue-100 object-cover shadow-xl flex-shrink-0"
          unoptimized
        />
        <div className="flex-1 text-center sm:text-left w-full">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Welcome back, {user.name}!</h1>
          <p className="text-blue-100 text-sm sm:text-base mb-3">
            <span className="inline-block">{academicDisplay}</span>
            <span className="hidden sm:inline"> • </span>
            <span className="block sm:inline">Year {user.year} • ID: {user.studentId}</span>
          </p>
          <form onSubmit={handleAvatarUpload} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input 
              type="file" 
              name="avatar" 
              accept="image/*" 
              className="block w-full sm:w-auto py-1.5 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 file:font-medium"
            />
            <button 
              type="submit" 
              disabled={avatarUploading} 
              className={`bg-white text-blue-600 font-semibold px-4 py-1.5 rounded text-xs sm:text-sm transition whitespace-nowrap ${avatarUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
            >
              {avatarUploading ? 'Uploading...' : 'Update Photo'}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center transition-all hover:shadow-md">
          <div className="p-2.5 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-3 sm:ml-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatStat(stats?.totalActivities)}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center transition-all hover:shadow-md">
          <div className="p-2.5 sm:p-3 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 sm:ml-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatStat(stats?.byStatus?.approved)}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Approved</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center transition-all hover:shadow-md">
          <div className="p-2.5 sm:p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 sm:ml-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatStat(stats?.byStatus?.pending)}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center transition-all hover:shadow-md">
          <div className="p-2.5 sm:p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="ml-3 sm:ml-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatStat(stats?.totalCredits)}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Credits</p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activities</h2>
          <button
            className="w-full sm:w-auto sm:ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-1 rounded-md text-sm font-medium transition-colors"
            onClick={() => router.push('/student/submit')}
          >
            Submit Activity
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <AnimatePresence>
            {recentActivities.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-3 sm:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{activity.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {activity.type.replace('_', ' ')} • {new Date(activity.date).toLocaleDateString()}
                      </p>
                      {activity.organizer && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">by {activity.organizer}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 sm:ml-4">
                      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {activity.credits} credits
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[activity.status] || 'text-gray-600 bg-gray-100'} whitespace-nowrap`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No activities yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your portfolio by submitting your first activity.</p>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => router.push('/student/submit')}
                >
                  Submit Activity
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
