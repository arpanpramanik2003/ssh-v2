'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { adminAPI } from '../../utils/api';
import { USER_ROLES, API_BASE_URL } from '../../utils/constants';
import { PROGRAM_CATEGORIES, UNIVERSITY_PROGRAMS, getProgramsByCategory, getSpecializations, getCategoryKey } from '../../utils/programsData';
import LoadingSpinner, { TableSkeleton } from '../shared/LoadingSpinner';

// Extracted as a proper component to avoid hooks-in-callback violation
const Modal = ({ isOpen, onClose, title, children, modalRef }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-colors"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const UserManagement = ({ user, token, onNavigate }) => {
  // Get backend base URL for image serving
  const backendBaseUrl = API_BASE_URL.replace('/api', '');
  
  // Helper function to get profile image URL (works for local and cloud)
  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    // Check if URL is already absolute (Cloudinary, external URL, etc.)
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `${backendBaseUrl}${profilePicture}`;
  };

  // Helper function to format program display for students
  const formatProgramDisplay = (userData) => {
    if (userData.role === 'student' && userData.program) {
      const parts = [userData.program];
      if (userData.specialization) {
        parts.push(userData.specialization);
      }
      return parts.join(' - ');
    }
    // For faculty, show program category or department
    if (userData.role === 'faculty') {
      return userData.programCategory || userData.department || 'Not specified';
    }
    // For admins, show department if any
    return userData.department || 'Not specified';
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    programCategory: 'all',
    program: 'all',
    specialization: 'all',
    year: 'all',
    admissionYear: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  
  // 🔥 FIX: Initialize formData properly
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    programCategory: '',
    program: '',
    specialization: '',
    year: '',
    admissionYear: '',
    studentId: ''
  });

  // Computed values for form cascading dropdowns
  const availablePrograms = useMemo(() => {
    try {
      if (!formData.programCategory) return [];
      // Handle both KEY format (e.g., "ENGINEERING") and VALUE format (e.g., "Engineering & Technology")
      const categoryName = PROGRAM_CATEGORIES[formData.programCategory] || formData.programCategory;
      const programs = getProgramsByCategory(categoryName);
      return programs || [];
    } catch (error) {
      console.error('Error getting available programs:', error, formData.programCategory);
      return [];
    }
  }, [formData.programCategory]);

  const availableSpecializations = useMemo(() => {
    try {
      if (!formData.programCategory || !formData.program) return [];
      // Handle both KEY format and VALUE format
      const categoryName = PROGRAM_CATEGORIES[formData.programCategory] || formData.programCategory;
      const specializations = getSpecializations(categoryName, formData.program);
      return specializations || [];
    } catch (error) {
      console.error('Error getting available specializations:', error, formData.programCategory, formData.program);
      return [];
    }
  }, [formData.programCategory, formData.program]);

  // Computed values for filter cascading dropdowns
  const filterPrograms = useMemo(() => {
    try {
      if (filters.programCategory === 'all') return [];
      const programs = getProgramsByCategory(filters.programCategory);
      return programs || [];
    } catch (error) {
      console.error('Error getting filter programs:', error, filters.programCategory);
      return [];
    }
  }, [filters.programCategory]);

  const filterSpecializations = useMemo(() => {
    try {
      if (filters.programCategory === 'all' || filters.program === 'all') return [];
      const specializations = getSpecializations(filters.programCategory, filters.program);
      return specializations || [];
    } catch (error) {
      console.error('Error getting filter specializations:', error, filters.programCategory, filters.program);
      return [];
    }
  }, [filters.programCategory, filters.program]);

  const modalRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const data = await adminAPI.getUsers(params);
      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Users fetch error:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const showSuccessMessage = useCallback((text) => {
    setMessage({ type: 'success', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const showErrorMessage = useCallback((text) => {
    setMessage({ type: 'error', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const handleToggleUserStatus = useCallback(async (userId) => {
    setActionLoading(userId);
    try {
      const response = await adminAPI.toggleUserStatus(userId);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: response.isActive } : u
      ));
      
      const targetUser = users.find(u => u.id === userId);
      const statusText = response.isActive ? 'activated' : 'deactivated';
      showSuccessMessage(`${targetUser?.name} has been ${statusText} successfully.`);
    } catch (error) {
      showErrorMessage(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [users, showSuccessMessage, showErrorMessage]);

  const handleDeleteUser = useCallback(async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    
    // Enhanced confirmation message with warning about related data
    const confirmMessage = targetUser?.role === 'student' 
      ? `⚠️ WARNING: Deleting "${targetUser?.name}" will:\n\n` +
        `• Delete all their submitted activities\n` +
        `• Remove all their portfolio data\n` +
        `• This action CANNOT be undone\n\n` +
        `Are you absolutely sure you want to proceed?`
      : targetUser?.role === 'faculty'
      ? `⚠️ WARNING: Deleting "${targetUser?.name}" will:\n\n` +
        `• Update activities they have approved\n` +
        `• This action CANNOT be undone\n\n` +
        `Are you absolutely sure you want to proceed?`
      : `Are you sure you want to delete "${targetUser?.name}"? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      showSuccessMessage(`${targetUser?.name} and all related data have been deleted successfully.`);
      
      // Refresh user list to ensure consistency
      await fetchUsers();
    } catch (error) {
      // Show specific backend error message
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete user';
      showErrorMessage(`Delete Failed: ${errorMsg}`);
      console.error('Delete user error:', error);
    } finally {
      setActionLoading(null);
    }
  }, [users, showSuccessMessage, showErrorMessage, fetchUsers]);

  const handleAddUser = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      department: '',
      programCategory: '',
      program: '',
      specialization: '',
      year: '',
      admissionYear: '',
      studentId: ''
    });
    setSelectedUser(null);
    setShowAddModal(true);
  }, []);

  const handleEditUser = useCallback((userData) => {
    // Convert programCategory from VALUE format (from DB) to KEY format (for form)
    const programCategoryKey = userData.programCategory ? getCategoryKey(userData.programCategory) : '';
    
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      password: '',
      role: userData.role || 'student',
      department: userData.department || '',
      programCategory: programCategoryKey || '',
      program: userData.program || '',
      specialization: userData.specialization || '',
      year: userData.year ? String(userData.year) : '',
      admissionYear: userData.admissionYear ? String(userData.admissionYear) : '',
      studentId: userData.studentId || ''
    });
    setSelectedUser(userData);
    setShowEditModal(true);
  }, []);

  // ✅ FIXED: Empty dependency array prevents recreation on every keystroke
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Clear role-specific fields when role changes
      if (name === 'role') {
        if (value === 'student') {
          // Keep student fields, clear specialization if needed
        } else if (value === 'faculty') {
          // Faculty only needs programCategory
          newData.program = '';
          newData.specialization = '';
          newData.year = '';
          newData.admissionYear = '';
          newData.studentId = '';
        } else {
          // Admin doesn't need any program fields
          newData.programCategory = '';
          newData.program = '';
          newData.specialization = '';
          newData.year = '';
          newData.admissionYear = '';
          newData.studentId = '';
        }
      }
      
      // Reset dependent fields when programCategory changes
      if (name === 'programCategory') {
        newData.program = '';
        newData.specialization = '';
      }
      
      // Reset specialization when program changes
      if (name === 'program') {
        newData.specialization = '';
      }
      
      return newData;
    });
  }, []); // ✅ Empty array prevents focus loss

  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    setActionLoading('form');

    try {
      if (selectedUser) {
        const { password, ...updateData } = formData;
        const response = await adminAPI.updateUser(selectedUser.id, updateData);
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, ...response.user } : u
        ));
        setShowEditModal(false);
        showSuccessMessage(`${formData.name} has been updated successfully.`);
      } else {
        const response = await adminAPI.createUser(formData);
        setUsers(prev => [response.user, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        setShowAddModal(false);
        showSuccessMessage(`${formData.name} has been created successfully.`);
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        programCategory: '',
        program: '',
        specialization: '',
        year: '',
        admissionYear: '',
        studentId: ''
      });
    } catch (error) {
      showErrorMessage(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }, [formData, selectedUser, showSuccessMessage, showErrorMessage]);

  const getRoleBadgeColor = useCallback((role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case USER_ROLES.FACULTY:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case USER_ROLES.STUDENT:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusBadgeColor = useCallback((isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  }, []);

  // 🔥 FIX: Memoize modal close handlers
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
  }, []);

  const handleViewDetails = useCallback((userData) => {
    setSelectedUser(userData);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
  }, []);

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={6} cols={5} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading users..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {message.show && (
        <div className={`rounded-md p-4 transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
              }`}>
                {message.text}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setMessage(prev => ({ ...prev, show: false }))}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  message.type === 'success' 
                    ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' 
                    : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4 transition-colors">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 transition-colors">Error Loading Users</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400 transition-colors">{error}</p>
              <button 
                onClick={fetchUsers}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline focus:outline-none"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Header */}
      <div className="bg-blue-600 dark:bg-blue-700 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 text-white border border-blue-700 dark:border-blue-800 transition-colors">
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              User Management
            </h1>
            <p className="text-blue-100 mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm transition-colors">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                {pagination.total} Total
              </span>
              <span className="text-blue-200 hidden sm:inline">•</span>
              <span>{users.filter(u => u.isActive).length} Active</span>
              <span className="text-blue-200 hidden sm:inline">•</span>
              <span>{users.filter(u => !u.isActive).length} Inactive</span>
            </p>
          </div>
          
          <button 
            onClick={handleAddUser}
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto sm:self-start"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New User
          </button>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Students</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{users.filter(u => u.role === 'student').length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Faculty</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{users.filter(u => u.role === 'faculty').length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Admins</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-100" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Program Categories</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{Object.values(PROGRAM_CATEGORIES).length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-100" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 transition-colors">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
          </svg>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Filter Users</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Users
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, email, program, or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Role
            </label>
            <div className="relative">
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 appearance-none pr-10"
              >
                <option value="all">All Roles</option>
                <option value={USER_ROLES.STUDENT}>Students</option>
                <option value={USER_ROLES.FACULTY}>Faculty</option>
                <option value={USER_ROLES.ADMIN}>Admins</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Program Category
            </label>
            <div className="relative">
              <select
                value={filters.programCategory}
                onChange={(e) => {
                  // Reset dependent filters in a single state update
                  setFilters(prev => ({ 
                    ...prev, 
                    programCategory: e.target.value,
                    program: 'all', 
                    specialization: 'all' 
                  }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 appearance-none pr-10"
              >
                <option value="all">All Categories</option>
                {Object.values(PROGRAM_CATEGORIES).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Program
            </label>
            <div className="relative">
              <select
                value={filters.program}
                onChange={(e) => {
                  // Reset specialization in a single state update
                  setFilters(prev => ({ 
                    ...prev, 
                    program: e.target.value,
                    specialization: 'all' 
                  }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                disabled={filters.programCategory === 'all'}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Programs</option>
                {filterPrograms.map(prog => (
                  <option key={prog.degree} value={prog.degree}>
                    {prog.degree} - {prog.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Specialization
            </label>
            <div className="relative">
              <select
                value={filters.specialization}
                onChange={(e) => handleFilterChange('specialization', e.target.value)}
                disabled={filters.programCategory === 'all' || filters.program === 'all'}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Specializations</option>
                {filterSpecializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Year
            </label>
            <div className="relative">
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 appearance-none pr-10"
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Batch (Admission Year)
            </label>
            <div className="relative">
              <select
                value={filters.admissionYear}
                onChange={(e) => handleFilterChange('admissionYear', e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 appearance-none pr-10"
              >
                <option value="all">All Batches</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 transition-colors">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center transition-colors">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-md">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div>
              <div className="text-base sm:text-lg">All Users</div>
              <div className="text-xs font-normal text-gray-500 dark:text-gray-400 transition-colors">Showing {users.length} of {pagination.total}</div>
            </div>
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="md" />
          </div>
        ) : users.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 transition-colors">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                      User
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                      Role
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                      Department
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                      Joined
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                  {users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userData.role === 'student' && userData.profilePicture && getProfileImageUrl(userData.profilePicture) ? (
                          <Image 
                            src={getProfileImageUrl(userData.profilePicture)} 
                            alt={userData.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-blue-300 shadow-md"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                            unoptimized
                          />
                        ) : null}
                        <div 
                          className={`${userData.role === 'student' && userData.profilePicture && getProfileImageUrl(userData.profilePicture) ? 'hidden' : 'flex'} w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full items-center justify-center mr-3 shadow-sm transition-colors`}
                        >
                          <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm transition-colors">
                            {userData.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">{userData.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{userData.email}</div>
                          {userData.studentId && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono transition-colors">ID: {userData.studentId}</div>
                          )}
                        </div>
                      </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(userData.role)}`}>
                          {userData.role?.charAt(0)?.toUpperCase() + userData.role?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        <div>
                          {formatProgramDisplay(userData)}
                          {userData.year && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Year {userData.year}</div>
                          )}
                          {userData.admissionYear && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 transition-colors">Batch {userData.admissionYear}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeColor(userData.isActive)}`}>
                        {userData.isActive ? (
                          <><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 mt-0.5"></span>Active</>
                        ) : (
                          <><span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 mt-0.5"></span>Inactive</>
                        )}
                      </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {new Date(userData.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(userData)}
                          className="group relative inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                          title="View detailed user information"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7C7.523 19 3.732 16.057 2.458 12z" />
                          </svg>
                          View
                        </button>

                        <button
                          onClick={() => handleEditUser(userData)}
                          className="group relative inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleToggleUserStatus(userData.id)}
                          disabled={actionLoading === userData.id || userData.role === USER_ROLES.ADMIN}
                          className={`group relative inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                            userData.isActive
                              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                          }`}
                        >
                          {actionLoading === userData.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {userData.isActive ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                              {userData.isActive ? 'Deactivate' : 'Activate'}
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(userData.id)}
                          disabled={actionLoading === userData.id || userData.role === USER_ROLES.ADMIN || userData.id === user.id}
                          className="group relative inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          title={userData.role === USER_ROLES.ADMIN ? 'Admin accounts cannot be deleted' : userData.id === user.id ? 'Cannot delete your own account' : 'Delete this user'}
                        >
                          {actionLoading === userData.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
            {users.map((userData) => (
              <div key={userData.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                {/* User Info */}
                <div className="flex items-start space-x-3 mb-3">
                  {userData.role === 'student' && userData.profilePicture && getProfileImageUrl(userData.profilePicture) ? (
                    <Image 
                      src={getProfileImageUrl(userData.profilePicture)} 
                      alt={userData.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-blue-300 shadow-md"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                      unoptimized
                    />
                  ) : null}
                  <div 
                    className={`${userData.role === 'student' && userData.profilePicture && getProfileImageUrl(userData.profilePicture) ? 'hidden' : 'flex'} w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <span className="text-blue-700 dark:text-blue-300 font-semibold text-base transition-colors">
                      {userData.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate transition-colors">{userData.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate transition-colors">{userData.email}</div>
                    {userData.studentId && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5 transition-colors">ID: {userData.studentId}</div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors">Role</div>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(userData.role)}`}>
                      {userData.role?.charAt(0)?.toUpperCase() + userData.role?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors">Status</div>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeColor(userData.isActive)}`}>
                      {userData.isActive ? (
                        <><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 mt-0.5"></span>Active</>
                      ) : (
                        <><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 mt-0.5"></span>Inactive</>
                      )}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors">{userData.role === 'student' ? 'Program' : 'Program Category'}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 truncate transition-colors">{formatProgramDisplay(userData)}</div>
                    {userData.year && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Year {userData.year}</div>
                    )}
                    {userData.admissionYear && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 transition-colors">Batch {userData.admissionYear}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 transition-colors">Joined</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
                      {new Date(userData.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleViewDetails(userData)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-sm"
                    title="View detailed user information"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7C7.523 19 3.732 16.057 2.458 12z" />
                    </svg>
                    View Details
                  </button>

                  <button
                    onClick={() => handleEditUser(userData)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit User
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggleUserStatus(userData.id)}
                      disabled={actionLoading === userData.id || userData.role === USER_ROLES.ADMIN}
                      className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        userData.isActive
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      }`}
                    >
                      {actionLoading === userData.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {userData.isActive ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                          {userData.isActive ? 'Deactivate' : 'Activate'}
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(userData.id)}
                      disabled={actionLoading === userData.id || userData.role === USER_ROLES.ADMIN || userData.id === user.id}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === userData.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.role !== 'all' || filters.programCategory !== 'all' || filters.program !== 'all' || filters.specialization !== 'all' || filters.year !== 'all' || filters.admissionYear !== 'all'
                ? 'Try adjusting your search filters or add new users.' 
                : 'Get started by adding your first user.'}
            </p>
            <button
              onClick={handleAddUser}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First User
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal - ✅ FIXED WITH STABLE HANDLERS */}
      <Modal 
        isOpen={showAddModal} 
        onClose={handleCloseAddModal}
        title="Add New User"
        modalRef={modalRef}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              required
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleFormChange}
              required
              placeholder="Enter password"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(formData.role === 'student' || formData.role === 'faculty') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Program Category *</label>
              <select
                name="programCategory"
                value={formData.programCategory}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Program Category</option>
                {Object.entries(PROGRAM_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              {formData.role === 'faculty' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  Faculty will only approve activities from students in this category
                </p>
              )}
            </div>
          )}

          {formData.role === 'student' && formData.programCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Program / Degree *</label>
              <select
                name="program"
                value={formData.program}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Program</option>
                {availablePrograms.map((prog) => (
                  <option key={prog.degree} value={prog.degree}>
                    {prog.degree} - {prog.name} ({prog.duration})
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'student' && formData.program && availableSpecializations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Specialization *</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Specialization</option>
                {availableSpecializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'faculty' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleFormChange}
                placeholder="e.g. Computer Science (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                Optional - for display purposes only
              </p>
            </div>
          )}

          {formData.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Current Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Admission Year (Batch) *</label>
                <input
                  type="number"
                  name="admissionYear"
                  value={formData.admissionYear}
                  onChange={handleFormChange}
                  required
                  min="1900"
                  max="2100"
                  placeholder="e.g., 2023"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Year student was admitted to the program</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleFormChange}
                  placeholder="Enter student ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
            <button
              type="button"
              onClick={handleCloseAddModal}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'form'}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
            >
              {actionLoading === 'form' ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal - ✅ FIXED WITH STABLE HANDLERS */}
      <Modal 
        isOpen={showEditModal} 
        onClose={handleCloseEditModal}
        title={`Edit User: ${selectedUser?.name}`}
        modalRef={modalRef}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              required
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(formData.role === 'student' || formData.role === 'faculty') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Program Category *</label>
              <select
                name="programCategory"
                value={formData.programCategory}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Program Category</option>
                {Object.entries(PROGRAM_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              {formData.role === 'faculty' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  Faculty will only approve activities from students in this category
                </p>
              )}
            </div>
          )}

          {formData.role === 'student' && formData.programCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Program / Degree *</label>
              <select
                name="program"
                value={formData.program}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Program</option>
                {availablePrograms.map((prog) => (
                  <option key={prog.degree} value={prog.degree}>
                    {prog.degree} - {prog.name} ({prog.duration})
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'student' && formData.program && availableSpecializations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Specialization *</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Specialization</option>
                {availableSpecializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'faculty' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleFormChange}
                placeholder="e.g. Computer Science (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                Optional - for display purposes only
              </p>
            </div>
          )}

          {formData.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Current Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Admission Year (Batch) *</label>
                <input
                  type="number"
                  name="admissionYear"
                  value={formData.admissionYear}
                  onChange={handleFormChange}
                  required
                  min="1900"
                  max="2100"
                  placeholder="e.g., 2023"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Year student was admitted to the program</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleFormChange}
                  placeholder="Enter student ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
            <button
              type="button"
              onClick={handleCloseEditModal}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'form'}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
            >
              {actionLoading === 'form' ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update User
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal 
        isOpen={showDetailsModal} 
        onClose={handleCloseDetailsModal}
        title=""
        modalRef={modalRef}
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-800 transition-colors">
              <div className="flex items-start gap-4">
                {selectedUser.role === 'student' && selectedUser.profilePicture && getProfileImageUrl(selectedUser.profilePicture) ? (
                  <Image 
                    src={getProfileImageUrl(selectedUser.profilePicture)} 
                    alt={selectedUser.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-4 border-teal-300 shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                    unoptimized
                  />
                ) : null}
                <div 
                  className={`${selectedUser.role === 'student' && selectedUser.profilePicture && getProfileImageUrl(selectedUser.profilePicture) ? 'hidden' : 'flex'} w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 rounded-full items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <span className="text-teal-700 dark:text-teal-300 font-bold text-2xl transition-colors">
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 truncate transition-colors">{selectedUser.name}</h2>
                  <p className="text-teal-600 dark:text-teal-400 font-medium mb-3 transition-colors">{selectedUser.email}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role?.charAt(0)?.toUpperCase() + selectedUser.role?.slice(1)}
                    </span>
                    <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeColor(selectedUser.isActive)}`}>
                      {selectedUser.isActive ? (
                        <><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 mt-0.5"></span>Active</>
                      ) : (
                        <><span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 mt-0.5"></span>Inactive</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-l-4 border-teal-500 pl-4 py-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center transition-colors">
                <svg className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all transition-colors">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center transition-colors">
                <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Academic Information
              </h3>
              <div className="space-y-4">
                {selectedUser.role === 'student' && selectedUser.profilePicture && getProfileImageUrl(selectedUser.profilePicture) && (
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg transition-colors text-center border-2 border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors mb-3 font-semibold">Profile Picture</p>
                    <Image 
                      src={getProfileImageUrl(selectedUser.profilePicture)} 
                      alt={selectedUser.name}
                      width={160}
                      height={160}
                      className="w-40 h-40 rounded-lg object-cover mx-auto shadow-lg border-2 border-blue-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      unoptimized
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {selectedUser.role === 'student' && selectedUser.programCategory && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Program Category</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 transition-colors">{selectedUser.programCategory}</p>
                    </div>
                  )}
                  {selectedUser.role === 'student' && selectedUser.program && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Program</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 transition-colors">{formatProgramDisplay(selectedUser)}</p>
                    </div>
                  )}
                  {selectedUser.role === 'faculty' && selectedUser.programCategory && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Program Category</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 transition-colors">{selectedUser.programCategory}</p>
                    </div>
                  )}
                  {selectedUser.department && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Department</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 transition-colors">{selectedUser.department}</p>
                    </div>
                  )}
                  {selectedUser.role === 'student' && selectedUser.year && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors">
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Year</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 transition-colors">Year {selectedUser.year}</p>
                    </div>
                  )}
                  {selectedUser.role === 'student' && selectedUser.admissionYear && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors">
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Admission Year</p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 transition-colors">Batch {selectedUser.admissionYear}</p>
                    </div>
                  )}
                  {selectedUser.role === 'student' && selectedUser.studentId && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors">
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Student ID</p>
                      <p className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 mt-1 transition-colors">{selectedUser.studentId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center transition-colors">
                <svg className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Account Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors">
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Joined Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 transition-colors">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors">
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Status</p>
                  <p className={`text-sm font-bold mt-1 transition-colors ${selectedUser.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                {selectedUser.updatedAt && (
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg transition-colors col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 transition-colors">
                      {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
              <button
                onClick={handleCloseDetailsModal}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseDetailsModal();
                  handleEditUser(selectedUser);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded-md text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-800 flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;

