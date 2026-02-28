'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const Reports = ({ user, token, onNavigate }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    format: 'json',
    status: 'all'
  });
  const [csvDownloading, setCsvDownloading] = useState(false);



  useEffect(() => {
    // Set default date range (last 6 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  }, []);

  // 🔥 Success/Error message functions
  const showSuccessMessage = useCallback((text) => {
    setMessage({ type: 'success', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const showErrorMessage = useCallback((text) => {
    setMessage({ type: 'error', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const handleGenerateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      showErrorMessage('Please select both start and end dates.');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      showErrorMessage('Start date cannot be later than end date.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Generating report with filters:', filters);
      const data = await adminAPI.getReports(filters);
      console.log('📊 Report data received:', data);
      
      setReportData(data);
      showSuccessMessage('Report generated successfully!');
    } catch (error) {
      console.error('Report generation error:', error);
      setError(error.message || 'Failed to generate report');
      showErrorMessage(`Error generating report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Proper CSV download implementation with correct API URL and all filters
  const handleDownloadCSV = async () => {
    if (!filters.startDate || !filters.endDate) {
      showErrorMessage('Please select date range before downloading CSV.');
      return;
    }

    setCsvDownloading(true);
    
    try {
      console.log('ðŸ“¥ Starting CSV download with filters:', filters);
      
      // Get the token from localStorage or props
      const authToken = localStorage.getItem('token') || token;
      
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Create params object with all filters (excluding 'all' values)
      const paramsObj = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: 'csv'
      };
      
      // Add activity status filter if not 'all'
      if (filters.status !== 'all') paramsObj.status = filters.status;
      
      const params = new URLSearchParams(paramsObj);
      const url = `${API_BASE_URL}/admin/reports?${params.toString()}`;
      console.log('📡 CSV Request URL:', url);
      
      // Make the request with proper authentication
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Get the CSV content
      const csvContent = await response.text();
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Create filename with date range
        link.setAttribute('download', `student-activity-report-${filters.startDate}-to-${filters.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
      }
      
      showSuccessMessage('CSV report downloaded successfully!');
      
    } catch (error) {
      console.error('CSV download error:', error);
      showErrorMessage(`Error downloading CSV: ${error.message}`);
    } finally {
      setCsvDownloading(false);
    }
  };



  // 🔥 Enhanced: Quick date range buttons
  const setQuickDateRange = useCallback((months) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  // 🔥 Enhanced: Calculate compliance metrics
  const getComplianceMetrics = () => {
    if (!reportData) return null;
    
    const total = reportData.summary?.totalActivities || 0;
    const approved = reportData.summary?.totalApprovedActivities || 0;
    const categories = Object.keys(reportData.summary?.programCategoryBreakdown || {}).length;
    const types = Object.keys(reportData.summary?.activityTypeBreakdown || {}).length;
    const credits = reportData.summary?.totalCredits || 0;
    
    return {
      naacCompliance: approved > 0 ? 'Compliant' : 'Non-Compliant',
      nirfScore: Math.min(100, Math.round((approved / 10) * 10)), // Simplified scoring based on approved activities
      aicteRequirement: credits >= 20 ? 'Met' : 'Not Met',
      participationRate: categories > 0 ? Math.round((approved / categories) * 100) / 100 : 0
    };
  };

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
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 transition-colors">Error Loading Report</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400 transition-colors">{error}</p>
              <button 
                onClick={handleGenerateReport}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline focus:outline-none"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Header */}
      <div className="bg-blue-600 dark:bg-blue-700 rounded-xl shadow-lg p-8 text-white border border-blue-700 dark:border-blue-800 transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              System Reports & Analytics
            </h1>
            <p className="text-blue-100 mt-2 flex items-center space-x-2 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Generate comprehensive reports for NAAC, NIRF, and AICTE compliance</span>
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-30 transition-colors">
            <div className="text-sm text-blue-100 mb-1 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Report Date Range
            </div>
            <div className="font-semibold text-lg">
              {filters.startDate && filters.endDate 
                ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
                : 'Select dates'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Report Filters - Enhanced */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Report Configuration</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Select date range and generate reports</p>
          </div>
        </div>
        
        {/* Quick Date Range Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center transition-colors">
            <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Date Ranges
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Last 3 Months', months: 3, icon: '📅' },
              { label: 'Last 6 Months', months: 6, icon: '📆' },
              { label: 'Last Year', months: 12, icon: '🗓️' },
              { label: 'Last 2 Years', months: 24, icon: '📊' }
            ].map(({ label, months, icon }) => (
              <button
                key={months}
                onClick={() => setQuickDateRange(months)}
                className="group relative px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                <span className="text-lg mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Start Date *
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center transition-colors">
              <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              End Date *
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>
        </div>

        {/* Additional Filters Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Advanced Filters (Optional)</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Filter reports by activity status to view pending, approved, or rejected activities
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Activity Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100 transition-all"
              >
                <option value="all">All Activities</option>
                <option value="approved">✅ Approved Only</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Status Filter
              </button>
            </div>

            {/* Info Box */}
            <div className="flex items-center px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-blue-800 dark:text-blue-300">
                Reports include all student activities
              </span>
            </div>
          </div>

          {/* Active Filters Display */}
          {filters.status !== 'all' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Active Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                  Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading || !filters.startDate || !filters.endDate}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleDownloadCSV}
              disabled={csvDownloading || !filters.startDate || !filters.endDate}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-800 dark:hover:to-emerald-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {csvDownloading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Summary - Professional & Mobile Responsive */}
      {reportData && (
        <>
          {/* Main Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Report Summary</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors">Key metrics & performance indicators</p>
              </div>
            </div>

            {/* Statistics Grid - Responsive: 1 col on mobile, 2 on tablet, 5 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {/* Total Activities Card */}
              <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-5 rounded-lg border border-blue-200 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 sm:p-3 bg-blue-500 dark:bg-blue-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 font-medium transition-colors">Total Activities</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100 transition-colors mt-0.5">{formatNumber(reportData.summary?.totalActivities || 0)}</p>
                    <p className="text-xs sm:text-xs text-blue-700 dark:text-blue-400 mt-1 transition-colors">All submissions</p>
                  </div>
                </div>
              </div>

              {/* Approved Activities Card */}
              <div className="group bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 p-4 sm:p-5 rounded-lg border border-green-200 dark:border-green-700/50 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 sm:p-3 bg-green-500 dark:bg-green-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-300 font-medium transition-colors">Approved</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100 transition-colors mt-0.5">{formatNumber(reportData.summary?.totalApprovedActivities || 0)}</p>
                    <p className="text-xs sm:text-xs text-green-700 dark:text-green-400 mt-1 transition-colors">Credit eligible</p>
                  </div>
                </div>
              </div>

              {/* Total Credits Card */}
              <div className="group bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 p-4 sm:p-5 rounded-lg border border-amber-200 dark:border-amber-700/50 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 sm:p-3 bg-amber-500 dark:bg-amber-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-300 font-medium transition-colors">Total Credits</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-100 transition-colors mt-0.5">{formatNumber(reportData.summary?.totalCredits || 0)}</p>
                    <p className="text-xs sm:text-xs text-amber-700 dark:text-amber-400 mt-1 transition-colors">
                      Avg: {(reportData.summary?.totalApprovedActivities || 0) > 0 
                        ? ((reportData.summary?.totalCredits || 0) / (reportData.summary?.totalApprovedActivities || 1)).toFixed(1)
                        : '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Program Categories Card */}
              <div className="group bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 p-4 sm:p-5 rounded-lg border border-purple-200 dark:border-purple-700/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 sm:p-3 bg-purple-500 dark:bg-purple-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300 font-medium transition-colors">Categories</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100 transition-colors mt-0.5">{Object.keys(reportData.summary?.programCategoryBreakdown || {}).length}</p>
                    <p className="text-xs sm:text-xs text-purple-700 dark:text-purple-400 mt-1 transition-colors">Participating</p>
                  </div>
                </div>
              </div>

              {/* Activity Types Card */}
              <div className="group bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/20 p-4 sm:p-5 rounded-lg border border-rose-200 dark:border-rose-700/50 hover:border-rose-300 dark:hover:border-rose-600 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 sm:p-3 bg-rose-500 dark:bg-rose-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-300 font-medium transition-colors">Activity Types</p>
                    <p className="text-xl sm:text-2xl font-bold text-rose-900 dark:text-rose-100 transition-colors mt-0.5">{Object.keys(reportData.summary?.activityTypeBreakdown || {}).length}</p>
                    <p className="text-xs sm:text-xs text-rose-700 dark:text-rose-400 mt-1 transition-colors">Categories covered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown Section */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 transition-colors">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 transition-colors">Status Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(reportData.summary?.statusBreakdown || {}).map(([status, count]) => {
                  const statusConfig = {
                    approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '✅', label: 'Approved' },
                    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: '⏳', label: 'Pending' },
                    rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '❌', label: 'Rejected' }
                  };
                  const config = statusConfig[status] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', icon: '📋', label: status };
                  
                  return (
                    <div key={status} className={`${config.bg} p-3 sm:p-4 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors hover:shadow-sm`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs sm:text-sm font-semibold ${config.text} transition-colors`}>{config.label}</p>
                        <span className="text-lg sm:text-xl">{config.icon}</span>
                      </div>
                      <p className={`text-lg sm:text-2xl font-bold ${config.text} transition-colors`}>{formatNumber(count)}</p>
                      <p className={`text-xs ${config.text} text-opacity-75 dark:text-opacity-75 mt-1 transition-colors`}>
                        {((count / (reportData.summary?.totalActivities || 1)) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Compliance Status */}
          {(() => {
            const compliance = getComplianceMetrics();
            return compliance && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Compliance Status</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Regulatory requirements and standards</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* NAAC Compliance */}
                  <div className={`p-4 rounded-lg border-2 transition-colors ${
                    compliance.naacCompliance === 'Compliant' 
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' 
                      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">NAAC</h3>
                      {compliance.naacCompliance === 'Compliant' ? (
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm transition-colors ${
                      compliance.naacCompliance === 'Compliant' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      Status: {compliance.naacCompliance}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                      Student activity documentation
                    </p>
                  </div>

                  {/* NIRF Scoring */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 p-4 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">NIRF</h3>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors">
                        {compliance.nirfScore}
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 transition-colors">
                      Estimated Score: {compliance.nirfScore}/100
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                      Based on student participation
                    </p>
                  </div>

                  {/* AICTE Requirements */}
                  <div className={`p-4 rounded-lg border-2 transition-colors ${
                    compliance.aicteRequirement === 'Met' 
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' 
                      : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">AICTE</h3>
                      {compliance.aicteRequirement === 'Met' ? (
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm transition-colors ${
                      compliance.aicteRequirement === 'Met' ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
                    }`}>
                      Credits: {compliance.aicteRequirement}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                      Minimum 20 credits required
                    </p>
                  </div>

                  {/* Participation Rate */}
                  <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 p-4 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Participation</h3>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-colors">
                        {compliance.participationRate}
                      </div>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 transition-colors">
                      Rate: {compliance.participationRate} activities/category
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                      Cross-category engagement
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Program Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Program Category Activity Breakdown</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Cross-category participation metrics</p>
              </div>
            </div>
            {Object.keys(reportData.summary?.programCategoryBreakdown || {}).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                  <thead className="bg-gray-50 dark:bg-gray-700 transition-colors">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Program Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Activities</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Participation Level</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                    {Object.entries(reportData.summary.programCategoryBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, count]) => {
                        const percentage = ((count / (reportData.summary?.totalActivities || 1)) * 100).toFixed(1);
                        let participationLevel = 'Low';
                        let levelColor = 'text-red-600 bg-red-50';
                        
                        if (percentage >= 30) {
                          participationLevel = 'High';
                          levelColor = 'text-green-600 bg-green-50';
                        } else if (percentage >= 15) {
                          participationLevel = 'Medium';
                          levelColor = 'text-yellow-600 bg-yellow-50';
                        }
                        
                        return (
                          <tr key={category} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">{category}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">{formatNumber(count)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">{percentage}%</div>
                              <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1 transition-colors">
                                <div 
                                  className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColor}`}>
                                {participationLevel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors">
                <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-2">No program category data available</p>
              </div>
            )}
          </div>

          {/* Activity Type Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 dark:from-yellow-600 dark:to-orange-700 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Activity Type Distribution</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Breakdown by activity categories</p>
              </div>
            </div>
            {Object.keys(reportData.summary?.activityTypeBreakdown || {}).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(reportData.summary.activityTypeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const percentage = ((count / (reportData.summary?.totalActivities || 1)) * 100).toFixed(1);
                    const typeLabels = {
                      'conference': { label: 'Conferences', icon: '🎤', color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300' },
                      'workshop': { label: 'Workshops', icon: '🔧', color: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' },
                      'seminar': { label: 'Seminars', icon: '📚', color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300' },
                      'competition': { label: 'Competitions', icon: '🏆', color: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300' },
                      'certification': { label: 'Certifications', icon: '📜', color: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300' },
                      'project': { label: 'Projects', icon: '🚀', color: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' }
                    };
                    
                    const typeInfo = typeLabels[type.toLowerCase()] || { 
                      label: type.charAt(0).toUpperCase() + type.slice(1), 
                      icon: '📋', 
                      color: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300' 
                    };
                    
                    return (
                      <div key={type} className={`p-4 rounded-lg border-2 ${typeInfo.color} transition-all duration-200 hover:scale-105`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{typeInfo.icon}</span>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{typeInfo.label}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{formatNumber(count)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm dark:text-gray-300 transition-colors">{percentage}% of total</span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 transition-colors">
                            <div 
                              className="bg-current h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors">
                <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="mt-2">No activity type data available</p>
              </div>
            )}
          </div>

          {/* Recent Activities Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Recent Activities</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Latest 10 submitted activities</p>
              </div>
            </div>
            {reportData.activities && reportData.activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                  <thead className="bg-gray-50 dark:bg-gray-700 transition-colors">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Credits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                    {reportData.activities.slice(0, 10).map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-48 truncate transition-colors" title={activity.title}>
                            {activity.title}
                          </div>
                          {activity.organizer && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-48 truncate transition-colors" title={activity.organizer}>
                              by {activity.organizer}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">{activity.student?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{activity.student?.studentId || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                          {activity.student?.program ? (
                            <div>
                              <div className="font-medium">{activity.student.program}</div>
                              {activity.student.specialization && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{activity.student.specialization}</div>
                              )}
                            </div>
                          ) : (
                            activity.student?.department || 'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 capitalize transition-colors">
                            {activity.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                          {activity.credits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize transition-colors ${
                            activity.status === 'approved' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : activity.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {activity.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                          {formatDate(activity.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors">
                <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No activities found for the selected date range</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">Try adjusting your date filters</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Enhanced Help Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-lg p-6 transition-colors">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-lg flex items-center justify-center mr-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 transition-colors">Compliance Information</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 transition-colors">Important guidelines and requirements</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300 transition-colors">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3 mt-2"></div>
              <div>
                <strong className="text-blue-900 dark:text-blue-100 transition-colors">NAAC Compliance:</strong> All approved student activities with proper documentation and evidence of participation
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-3 mt-2"></div>
              <div>
                <strong className="text-blue-900 dark:text-blue-100 transition-colors">NIRF Ranking:</strong> Program-wise activity distribution and student engagement metrics for ranking assessment
              </div>
            </div>
          </div>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300 transition-colors">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mr-3 mt-2"></div>
              <div>
                <strong className="text-blue-900 dark:text-blue-100 transition-colors">AICTE Requirements:</strong> Student participation in co-curricular and extra-curricular activities with minimum credit requirements
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full mr-3 mt-2"></div>
              <div>
                <strong className="text-blue-900 dark:text-blue-100 transition-colors">CSV Export:</strong> Download complete data for external analysis, submission to regulatory bodies, and institutional reporting
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 border border-blue-300 dark:border-blue-600 rounded-md transition-colors">
          <p className="text-xs text-blue-700 dark:text-blue-300 transition-colors">
            <strong>💡 Tip:</strong> Generate reports regularly to track compliance status and identify areas for improvement. Use different date ranges to analyze trends and seasonal patterns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;

