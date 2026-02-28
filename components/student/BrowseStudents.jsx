'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { studentAPI } from '../../utils/api';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { PROGRAM_CATEGORIES, UNIVERSITY_PROGRAMS, getProgramsByCategory, getSpecializations } from '../../utils/programsData';

const backendBaseUrl = API_BASE_URL.replace('/api', '');

const BrowseStudents = ({ user, token }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programCategoryFilter, setProgramCategoryFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [admissionYearFilter, setAdmissionYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
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
        limit: 12,
        search: search.trim(),
        programCategory: progCat !== 'all' ? progCat : undefined,
        program: prog !== 'all' ? prog : undefined,
        specialization: spec !== 'all' ? spec : undefined,
        year: yr !== 'all' ? yr : undefined,
        admissionYear: admYr !== 'all' ? admYr : undefined,
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const data = await studentAPI.getAllStudents(params);
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
      setCurrentPage(1);
      fetchStudents(1, searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, programCategoryFilter, programFilter, specializationFilter, yearFilter, admissionYearFilter, fetchStudents]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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
    setCurrentPage(1);
    fetchStudents(1, '', 'all', 'all', 'all', 'all', 'all');
  };

  const getProfileImage = (profilePicture) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http')
      ? profilePicture
      : `${backendBaseUrl}${profilePicture}`;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getActivityIcon = (type) => {
    const icons = {
      conference: '🎤',
      workshop: '🔧',
      seminar: '📚',
      competition: '🏆',
      certification: '📜',
      internship: '💼',
      project: '🚀',
      volunteering: '🤝',
      leadership: '👑',
      research: '🔬',
      publication: '📖',
      award: '🥇',
      community_service: '🤲',
      club_activity: '🎭',
      online_course: '📱'
    };
    return icons[type?.toLowerCase()] || '📋';
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    return filePath.startsWith('http') ? filePath : `${backendBaseUrl}${filePath}`;
  };

  // Student Card Component
  const StudentCard = ({ student }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        onClick={() => setSelectedStudent(student)}
        className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
      >
        {/* Profile Section */}
        <div className="px-4 py-4">
          {/* Profile Picture - Compact */}
          <div className="flex justify-center mb-3">
            {imageError || !student.profilePicture ? (
              <div className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center shadow-lg text-white font-bold text-xl">
                {getInitials(student.name)}
              </div>
            ) : (
              <Image
                src={getProfileImage(student.profilePicture)}
                alt={student.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover shadow-lg"
                onError={() => setImageError(true)}
                unoptimized
              />
            )}
          </div>

          {/* Name and Info - Compact */}
          <div className="text-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-0.5 line-clamp-1">
              {student.name}
            </h3>
            {student.programCategory ? (
              <>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {student.program || student.department}
                </p>
                {student.specialization && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1.5 line-clamp-1">
                    {student.specialization}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                {student.department}
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                Year {student.year}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                {student.studentId}
              </span>
            </div>
          </div>

          {/* Social Links - Icon Only */}
          {(student.linkedinUrl || student.githubUrl || student.portfolioUrl) && (
            <div className="flex gap-2 justify-center mb-3">
              {student.linkedinUrl && (
                <a
                  href={student.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-all hover:scale-110"
                  onClick={(e) => e.stopPropagation()}
                  title="LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              )}
              {student.githubUrl && (
                <a
                  href={student.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all hover:scale-110"
                  onClick={(e) => e.stopPropagation()}
                  title="GitHub"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
              {student.portfolioUrl && (
                <a
                  href={student.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg transition-all hover:scale-110"
                  onClick={(e) => e.stopPropagation()}
                  title="Portfolio"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Stats - Compact */}
          <div className="grid grid-cols-2 gap-2 py-3 mb-3 border-y border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {student.stats?.totalApprovedActivities || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Activities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {student.stats?.totalCredits || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Credits</p>
            </div>
          </div>

          {/* Recent Activity - Single Item Only */}
          {student.activities && student.activities.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Recent Achievement
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-base">{getActivityIcon(student.activities[0].type)}</span>
                <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                  {student.activities[0].title}
                </span>
              </div>
            </div>
          )}

          {/* View Button - Compact */}
          <button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View Profile</span>
          </button>
        </div>
      </motion.div>
    );
  };

  // Student Detail Modal Component
  const StudentDetailModal = ({ student, onClose }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-blue-600 dark:bg-blue-700 px-6 py-6 flex justify-between items-start z-10">
              <div className="flex items-center gap-4">
                {imageError || !student.profilePicture ? (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 text-white font-bold text-2xl">
                    {getInitials(student.name)}
                  </div>
                ) : (
                  <Image
                    src={getProfileImage(student.profilePicture)}
                    alt={student.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"
                    onError={() => setImageError(true)}
                    unoptimized
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{student.name}</h2>
                  {student.programCategory ? (
                    <p className="text-blue-100 text-sm">
                      {student.program}{student.specialization ? ` - ${student.specialization}` : ''} • Year {student.year}
                    </p>
                  ) : (
                    <p className="text-blue-100 text-sm">{student.department} • Year {student.year}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Student ID" value={student.studentId} icon="🆔" />
                <InfoItem label="Email" value={student.email} icon="📧" />
                {student.phone && <InfoItem label="Phone" value={student.phone} icon="📱" />}
                {student.dateOfBirth && <InfoItem label="Date of Birth" value={new Date(student.dateOfBirth).toLocaleDateString()} icon="🎂" />}
                {student.gender && <InfoItem label="Gender" value={student.gender} icon="👤" />}
              </div>

              {/* Social Links */}
              {(student.linkedinUrl || student.githubUrl || student.portfolioUrl) && (
                <Section title="Connect" icon="🔗">
                  <div className="flex flex-wrap gap-3">
                    {student.linkedinUrl && <SocialLink href={student.linkedinUrl} label="LinkedIn" color="blue" />}
                    {student.githubUrl && <SocialLink href={student.githubUrl} label="GitHub" color="gray" />}
                    {student.portfolioUrl && <SocialLink href={student.portfolioUrl} label="Portfolio" color="purple" />}
                  </div>
                </Section>
              )}

              {/* Skills & Interests */}
              {(student.skills || student.languages || student.hobbies) && (
                <Section title="Skills & Interests" icon="✨">
                  <div className="space-y-4">
                    {student.skills && (
                      <TagGroup label="Skills" tags={student.skills.split(',').map(s => s.trim()).filter(Boolean)} color="blue" />
                    )}
                    {student.languages && (
                      <TagGroup label="Languages" tags={student.languages.split(',').map(l => l.trim()).filter(Boolean)} color="green" />
                    )}
                    {student.hobbies && (
                      <TagGroup label="Hobbies" tags={student.hobbies.split(',').map(h => h.trim()).filter(Boolean)} color="purple" />
                    )}
                  </div>
                </Section>
              )}

              {/* About */}
              {student.otherDetails && (
                <Section title="About" icon="📝">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {student.otherDetails}
                  </p>
                </Section>
              )}

              {/* Achievements */}
              {student.achievements && (
                <Section title="Achievements" icon="🏆">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {student.achievements}
                  </p>
                </Section>
              )}

              {/* Activity Stats */}
              <Section title="Activity Statistics" icon="📊">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    value={student.stats?.totalApprovedActivities || 0}
                    label="Approved Activities"
                    color="blue"
                    icon="✅"
                  />
                  <StatCard
                    value={student.stats?.totalCredits || 0}
                    label="Total Credits"
                    color="green"
                    icon="⭐"
                  />
                </div>
              </Section>

              {/* Approved Activities */}
              {student.activities && student.activities.length > 0 && (
                <Section title="Approved Activities" icon="🎯">
                  <div className="space-y-3">
                    {student.activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} getFileUrl={getFileUrl} getActivityIcon={getActivityIcon} />
                    ))}
                  </div>
                </Section>
              )}

              {/* No Activities */}
              {(!student.activities || student.activities.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    No approved activities yet
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Helper Components
  const InfoItem = ({ label, value, icon }) => (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </p>
      <p className="font-semibold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  );

  const Section = ({ title, icon, children }) => (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
        <span className="text-2xl">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );

  const SocialLink = ({ href, label, color }) => {
    const colors = {
      blue: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      gray: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
      purple: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400'
    };
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 ${colors[color]}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {label}
      </a>
    );
  };

  const TagGroup = ({ label, tags, color }) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return (
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span key={idx} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${colors[color]}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const StatCard = ({ value, label, color, icon }) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
    };
    return (
      <div className={`p-4 rounded-xl ${colors[color]}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{icon}</span>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <p className="text-sm font-medium opacity-80">{label}</p>
      </div>
    );
  };

  const ActivityCard = ({ activity, getFileUrl, getActivityIcon }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
      <div className="flex items-start gap-4">
        <span className="text-3xl">{getActivityIcon(activity.type)}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {activity.title}
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {activity.organizer && (
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {activity.organizer}
              </p>
            )}
            {activity.date && (
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(activity.date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        {activity.filePath && (
          <a
            href={getFileUrl(activity.filePath)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </a>
        )}
      </div>
    </div>
  );

  if (loading && students.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <CardSkeleton cards={6} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Discovering students..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-blue-600 dark:bg-blue-900 rounded-xl shadow-lg p-4 sm:p-6 text-white relative overflow-hidden border border-blue-400 dark:border-blue-700/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij4KPHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNGg0djRoLTR2LTR6bS05LTloMTN2MTNoLTEzVjIxem05IDdoMnYyaC0ydi0yem0tNCAwaDF2Mmgtdi0yem0tMiAwaDF2Mmgtdi0yeiIvPgo8L2c+CjwvZz4KPC9zdmc+')] opacity-20" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl">🎓</span>
            Browse Peers
          </h1>
          <p className="text-blue-100 text-sm sm:text-base">
            Discover peers, explore achievements, and connect with fellow students
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              🔍 Search Students
            </label>
            <input
              type="text"
              placeholder="Name, email, ID, program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              🎓 Program Category
            </label>
            <select
              value={programCategoryFilter}
              onChange={(e) => {
                setProgramCategoryFilter(e.target.value);
                setProgramFilter('all'); // Reset program when category changes
                setSpecializationFilter('all'); // Reset specialization as well
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Categories</option>
              {Object.values(PROGRAM_CATEGORIES).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              📚 Program
            </label>
            <select
              value={programFilter}
              onChange={(e) => {
                setProgramFilter(e.target.value);
                setSpecializationFilter('all'); // Reset specialization when program changes
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Programs</option>
              {filteredPrograms.map((prog) => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              🎯 Specialization
            </label>
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Specializations</option>
              {filteredSpecializations.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              📅 Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              🎓 Batch (Admission Year)
            </label>
            <select
              value={admissionYearFilter}
              onChange={(e) => setAdmissionYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all hover:scale-105 text-sm"
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Found <span className="font-bold text-gray-900 dark:text-white">{pagination.total || 0}</span> student{pagination.total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Students Grid */}
      {students.length > 0 ? (
        <>
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold text-sm"
              >
                ⏮️
              </button>

              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let page;
                if (pagination.pages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= pagination.pages - 2) {
                  page = pagination.pages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return page;
              }).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                    currentPage === page
                      ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md scale-105'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={currentPage === pagination.pages}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold text-sm"
              >
                ⏭️
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-3">📭</div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No students found</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Try adjusting your filters or search criteria</p>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
};

export default BrowseStudents;

