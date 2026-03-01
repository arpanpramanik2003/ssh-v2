'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { facultyAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import { PROGRAM_CATEGORIES, getProgramsByCategory, getSpecializations } from '../../utils/programsData';
import LoadingSpinner, { TableSkeleton } from '../shared/LoadingSpinner';

const StudentList = ({ user }) => {
  // Get backend base URL for image serving
  const backendBaseUrl = API_BASE_URL.replace('/api', '');
  
  // Helper function to get profile image URL
  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    // Check if URL is already absolute (Cloudinary, external URL, etc.)
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `${backendBaseUrl}${profilePicture}`;
  };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programCategoryFilter, setProgramCategoryFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [admissionYearFilter, setAdmissionYearFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    hasMore: false
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  // Compute filtered programs based on selected category
  const filteredPrograms = useMemo(() => {
    if (programCategoryFilter === 'all') {
      return programs; // Show all programs from DB when no category selected
    }
    // Get programs for the selected category from our data structure
    const categoryKey = Object.keys(PROGRAM_CATEGORIES).find(
      key => PROGRAM_CATEGORIES[key] === programCategoryFilter
    );
    if (!categoryKey) return [];
    const categoryPrograms = getProgramsByCategory(categoryKey);
    return categoryPrograms.map(p => p.degree);
  }, [programCategoryFilter, programs]);

  // Compute filtered specializations based on selected category and program
  const filteredSpecializations = useMemo(() => {
    if (programCategoryFilter === 'all' || programFilter === 'all') {
      return specializations; // Show all when no filters
    }
    const categoryKey = Object.keys(PROGRAM_CATEGORIES).find(
      key => PROGRAM_CATEGORIES[key] === programCategoryFilter
    );
    if (!categoryKey) return [];
    const specs = getSpecializations(categoryKey, programFilter);
    return specs;
  }, [programCategoryFilter, programFilter, specializations]);

  // Fetch students data
  const fetchStudents = useCallback(async (page = 1, search = '', progCat = 'all', prog = 'all', spec = 'all', yr = 'all', admYr = 'all') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search.trim(),
        programCategory: progCat !== 'all' ? progCat : undefined,
        program: prog !== 'all' ? prog : undefined,
        specialization: spec !== 'all' ? spec : undefined,
        year: yr !== 'all' ? yr : undefined,
        admissionYear: admYr !== 'all' ? admYr : undefined,
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const data = await facultyAPI.getAllStudents(params);
      setStudents(data.students);
      setPagination(data.pagination);

      if (page === 1 && !search && progCat === 'all') {
        const uniqueProgs = [...new Set(data.students.map(s => s.program).filter(Boolean))].sort();
        const uniqueSpecs = [...new Set(data.students.map(s => s.specialization).filter(Boolean))].sort();
        setPrograms(uniqueProgs);
        setSpecializations(uniqueSpecs);
      }
    } catch (error) {
      console.error('Fetch students error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(1, '', 'all', 'all', 'all', 'all', 'all');
  }, [fetchStudents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchStudents(1, searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter, fetchStudents]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchStudents(newPage, searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setProgramCategoryFilter('all');
    setProgramFilter('all');
    setSpecializationFilter('all');
    setYearFilter('all');
    setAdmissionYearFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStudents(1, '', 'all', 'all', 'all', 'all', 'all');
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  if (loading && students.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={5} cols={4} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading students..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-900 rounded-xl shadow-lg p-6 text-white border border-blue-400 dark:border-blue-700/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Students Directory
            </h1>
            <p className="text-blue-100 dark:text-blue-200">Browse all students across programs and departments</p>
            {user.programCategory && (
              <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <span className="font-medium">Your Category: {PROGRAM_CATEGORIES[user.programCategory]}</span>
              </div>
            )}
          </div>
          <div className="bg-white bg-opacity-20 dark:bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 transition-colors">
            <div className="text-xs text-blue-200">Total Students</div>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, student ID, program..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <svg 
                  className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                🎓 Program Category
              </label>
              <select
                value={programCategoryFilter}
                onChange={(e) => {
                  setProgramCategoryFilter(e.target.value);
                  setProgramFilter('all'); // Reset program when category changes
                  setSpecializationFilter('all'); // Reset specialization as well
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Categories</option>
                {Object.values(PROGRAM_CATEGORIES).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                📚 Program
              </label>
              <select
                value={programFilter}
                onChange={(e) => {
                  setProgramFilter(e.target.value);
                  setSpecializationFilter('all'); // Reset specialization when program changes
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Programs</option>
                {filteredPrograms.map(prog => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                🎯 Specialization
              </label>
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Specializations</option>
                {filteredSpecializations.map(spec => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                📅 Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                🎓 Batch (Admission Year)
              </label>
              <select
                value={admissionYearFilter}
                onChange={(e) => setAdmissionYearFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Batches</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              {(searchTerm || programCategoryFilter !== 'all' || programFilter !== 'all' || specializationFilter !== 'all' || yearFilter !== 'all' || admissionYearFilter !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all hover:scale-105"
                >
                  🔄 Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Found <span className="font-bold text-gray-900 dark:text-white">{pagination.total || 0}</span> student{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 transition-colors">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                  Program / Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                  Activities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.profilePicture ? (
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={getProfileImageUrl(student.profilePicture)}
                              alt={student.name}
                              width={40}
                              height={40}
                              unoptimized
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">{student.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-100 transition-colors">{student.studentId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {student.programCategory ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{student.program}</div>
                          {student.specialization && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">{student.specialization}</div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">{student.programCategory}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">{student.department || 'N/A'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors">Year {student.year || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                          {student.stats?.totalActivities || 0}
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400 transition-colors">
                          {student.stats?.approvedActivities || 0} approved
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 transition-colors">
                        {student.stats?.totalCredits || 0} credits
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(student)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 transition-colors">
            <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
              Showing page <span className="font-medium">{pagination.page}</span> of{' '}
              <span className="font-medium">{pagination.pages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto transition-colors">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl my-8 transition-colors">
            {/* Modal Header */}
            <div className="bg-blue-600 dark:bg-blue-900 text-white px-6 py-4 rounded-t-xl flex items-center justify-between border-b border-blue-400 dark:border-blue-700/50 transition-colors">
              <div className="flex items-center">
                {selectedStudent.profilePicture ? (
                  <Image
                    className="h-16 w-16 rounded-full border-4 border-white object-cover"
                    src={getProfileImageUrl(selectedStudent.profilePicture)}
                    alt={selectedStudent.name}
                    width={64}
                    height={64}
                    unoptimized
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border-4 border-white bg-white flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-4">
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-blue-100 dark:text-blue-200">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Student ID" value={selectedStudent.studentId} />
                  <InfoField label="Department" value={selectedStudent.department} />
                  <InfoField label="Year" value={selectedStudent.year ? `Year ${selectedStudent.year}` : 'N/A'} />
                  <InfoField label="Phone" value={selectedStudent.phone} />
                  <InfoField label="Date of Birth" value={selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'N/A'} />
                  <InfoField label="Gender" value={selectedStudent.gender} />
                  <InfoField label="Category" value={selectedStudent.category} />
                  <InfoField label="Status" value={selectedStudent.isActive ? 'Active' : 'Inactive'} />
                </div>
              </div>

              {/* Academic Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="10th Result" value={selectedStudent.tenthResult ? `${selectedStudent.tenthResult}%` : 'N/A'} />
                  <InfoField label="12th Result" value={selectedStudent.twelfthResult ? `${selectedStudent.twelfthResult}%` : 'N/A'} />
                </div>
              </div>

              {/* Activity Statistics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Activity Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 transition-colors">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Activities</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors">{selectedStudent.stats?.totalActivities || 0}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 transition-colors">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Approved Activities</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors">{selectedStudent.stats?.approvedActivities || 0}</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 transition-colors">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Credits</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-colors">{selectedStudent.stats?.totalCredits || 0}</div>
                  </div>
                </div>
              </div>

              {/* Skills & Languages */}
              {(selectedStudent.skills || selectedStudent.languages) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                    Skills & Languages
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStudent.skills && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">Technical Skills</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.skills.split(',').map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm rounded-full transition-colors">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedStudent.languages && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">Languages</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.languages.split(',').map((lang, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm rounded-full transition-colors">
                              {lang.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {(selectedStudent.hobbies || selectedStudent.achievements || selectedStudent.projects || selectedStudent.certifications) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Additional Information
                  </h3>
                  <div className="space-y-4">
                    <InfoField label="Hobbies" value={selectedStudent.hobbies} multiline />
                    <InfoField label="Achievements" value={selectedStudent.achievements} multiline />
                    <InfoField label="Projects" value={selectedStudent.projects} multiline />
                    <InfoField label="Certifications" value={selectedStudent.certifications} multiline />
                  </div>
                </div>
              )}

              {/* Links */}
              {(selectedStudent.linkedinUrl || selectedStudent.githubUrl || selectedStudent.portfolioUrl) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    Online Profiles
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedStudent.linkedinUrl && (
                      <a
                        href={selectedStudent.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                    {selectedStudent.githubUrl && (
                      <a
                        href={selectedStudent.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                      </a>
                    )}
                    {selectedStudent.portfolioUrl && (
                      <a
                        href={selectedStudent.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Address */}
              {selectedStudent.address && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Contact Address
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap transition-colors">{selectedStudent.address}</p>
                </div>
              )}

              {/* Other Details */}
              {selectedStudent.otherDetails && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2 transition-colors">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Other Details
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap transition-colors">{selectedStudent.otherDetails}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-xl flex justify-end transition-colors">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for displaying information fields
const InfoField = ({ label, value, multiline = false }) => {
  if (!value || value === 'N/A') {
    return (
      <div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors">{label}</div>
        <div className="text-gray-400 dark:text-gray-500 italic transition-colors">Not provided</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">{label}</div>
      {multiline ? (
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap transition-colors">{value}</p>
      ) : (
        <div className="text-gray-900 dark:text-gray-100 transition-colors">{value}</div>
      )}
    </div>
  );
};

export default StudentList;

