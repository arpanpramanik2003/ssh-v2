'use client';
import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../utils/api';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';
import jsPDF from 'jspdf';
import StudentCVForm from './StudentCVForm';
import { getStudentProgramDisplay } from '../../utils/userDisplay';

const Portfolio = ({ user, token, isReadOnly = false }) => {
  const academicDisplay = getStudentProgramDisplay(user);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdowns = document.querySelectorAll('.share-dropdown');
      dropdowns.forEach(dropdown => {
        if (!dropdown.parentElement.contains(event.target)) {
          dropdown.classList.add('hidden');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch activities, stats, AND CV/profile details
  const fetchPortfolioData = async () => {
    try {
      const [activitiesData, statsData, profileData] = await Promise.all([
        studentAPI.getActivities({ status: 'approved' }),
        studentAPI.getStats(),
        studentAPI.getProfile(),
      ]);
      setActivities(activitiesData.activities);
      setStats(statsData);
      setProfile(profileData.profile);
    } catch (error) {
      console.error('Portfolio fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupActivitiesByType = (activities) => {
    return activities.reduce((groups, activity) => {
      const type = activity.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(activity);
      return groups;
    }, {});
  };

  const activityGroups = groupActivitiesByType(activities);

  const getTypeLabel = (type) => {
    return type.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
      award: '🥇'
    };
    return icons[type.toLowerCase()] || '📋';
  };

// Professional ATS-friendly CV generation with modern design
const generateEnhancedPDF = () => {
  setIsGenerating(true);
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Helper function to add section with modern styling
  const addSection = (title, content, isFirst = false) => {
    if (!content) return y;
    
    if (!isFirst && y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }

    // Section title with underline
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 25, 112); // Navy blue
    doc.text(title.toUpperCase(), margin, y);
    
    // Underline
    const titleWidth = doc.getTextWidth(title.toUpperCase());
    y += 1;
    doc.setDrawColor(25, 25, 112);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + titleWidth, y);
    y += 6;

    return y;
  };

  // === HEADER SECTION ===
  doc.setFillColor(25, 25, 112); // Navy blue background
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(user.name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
  
  // Title/Department
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${academicDisplay} • Year ${user.year}`, pageWidth / 2, 23, { align: 'center' });
  
  // Contact Line
  const contactParts = [];
  if (profile?.phone) contactParts.push(profile.phone);
  if (user.email) contactParts.push(user.email);
  if (profile?.address) {
    const shortAddress = profile.address.split(',').slice(-2).join(',').trim();
    contactParts.push(shortAddress);
  }
  const contactLine = contactParts.join(' • ');
  doc.setFontSize(9);
  doc.text(contactLine, pageWidth / 2, 30, { align: 'center' });

  y = 45;

  // === SOCIAL LINKS ===
  if (profile?.linkedinUrl || profile?.githubUrl || profile?.portfolioUrl) {
    const links = [];
    if (profile.linkedinUrl) links.push({ text: 'LinkedIn', url: profile.linkedinUrl });
    if (profile.githubUrl) links.push({ text: 'GitHub', url: profile.githubUrl });
    if (profile.portfolioUrl) links.push({ text: 'Portfolio', url: profile.portfolioUrl });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 102, 204);
    
    const linkTexts = links.map(l => l.text).join(' • ');
    doc.text(linkTexts, pageWidth / 2, y, { align: 'center' });
    
    // Add clickable links
    links.forEach((link, idx) => {
      const xPos = (pageWidth / 2) - (doc.getTextWidth(linkTexts) / 2) + 
                   (idx > 0 ? doc.getTextWidth(links.slice(0, idx).map(l => l.text).join(' • ') + ' • ') : 0);
      doc.link(xPos, y - 3, doc.getTextWidth(link.text), 4, { url: link.url });
    });
    
    y += 10;
    doc.setTextColor(0, 0, 0);
  }

  // === CAREER OBJECTIVE / SUMMARY ===
  if (profile?.otherDetails) {
    y = addSection('Career Objective', profile.otherDetails, true);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const objectiveLines = doc.splitTextToSize(profile.otherDetails, contentWidth);
    doc.text(objectiveLines, margin, y);
    y += objectiveLines.length * 5 + 8;
  }

  // === EDUCATION ===
  y = addSection('Education');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  // Current Education
  doc.setFont('helvetica', 'bold');
  doc.text(`${academicDisplay}`, margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Year ${user.year}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Present', margin + 5, y);
  y += 7;

  // 12th Grade
  if (profile?.twelfthResult) {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('Higher Secondary (12th)', margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.twelfthResult, pageWidth - margin, y, { align: 'right' });
    y += 7;
  }

  // 10th Grade
  if (profile?.tenthResult) {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('Secondary (10th)', margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.tenthResult, pageWidth - margin, y, { align: 'right' });
    y += 7;
  }
  
  y += 5;

  // === TECHNICAL SKILLS ===
  if (profile?.skills) {
    y = addSection('Technical Skills');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const skillsLines = doc.splitTextToSize(profile.skills, contentWidth);
    doc.text(skillsLines, margin + 5, y);
    y += skillsLines.length * 5 + 8;
  }

  // === PROJECTS ===
  if (profile?.projects) {
    y = addSection('Projects');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const projectLines = doc.splitTextToSize(profile.projects, contentWidth);
    doc.text(projectLines, margin + 5, y);
    y += projectLines.length * 5 + 8;
  }

  // === CERTIFICATIONS ===
  if (profile?.certifications) {
    y = addSection('Certifications');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const certLines = doc.splitTextToSize(profile.certifications, contentWidth);
    doc.text(certLines, margin + 5, y);
    y += certLines.length * 5 + 8;
  }

  // === CO-CURRICULAR ACTIVITIES ===
  if (activities.length > 0) {
    y = addSection('Co-Curricular Activities');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    Object.entries(activityGroups).forEach(([type, typeActivities]) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      // Activity type subheading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(getTypeLabel(type), margin + 5, y);
      y += 6;

      typeActivities.forEach((activity) => {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Activity title with date on same line
        const dateStr = new Date(activity.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        doc.text(`• ${activity.title}`, margin + 8, y);
        doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
        y += 4;
        
        if (activity.organizer) {
          doc.setTextColor(80, 80, 80);
          doc.text(`  ${activity.organizer}`, margin + 10, y);
          y += 4;
          doc.setTextColor(50, 50, 50);
        }
        
        y += 2;
      });

      y += 4;
    });
  }

  // === ACHIEVEMENTS ===
  if (profile?.achievements) {
    y = addSection('Achievements & Awards');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const achievementLines = doc.splitTextToSize(profile.achievements, contentWidth);
    doc.text(achievementLines, margin + 5, y);
    y += achievementLines.length * 5 + 8;
  }

  // === PERSONAL INFORMATION ===
  const personalInfo = [];
  if (profile?.dateOfBirth) personalInfo.push(`DOB: ${new Date(profile.dateOfBirth).toLocaleDateString('en-GB')}`);
  if (profile?.gender) personalInfo.push(`Gender: ${profile.gender}`);
  if (profile?.languages) personalInfo.push(`Languages: ${profile.languages}`);
  
  if (personalInfo.length > 0) {
    y = addSection('Personal Information');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(personalInfo.join(' • '), margin + 5, y);
    y += 6;
  }

  // === HOBBIES ===
  if (profile?.hobbies) {
    y = addSection('Hobbies & Interests');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(profile.hobbies, margin + 5, y);
    y += 6;
  }

  // === FOOTER ===
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  doc.save(`${user.name.replace(/\s+/g, '_')}_CV.pdf`);
  setIsGenerating(false);
};



  // 🔥 Enhanced share functionality
  const handleSharePortfolio = async (type = 'link') => {
    try {
      let shareData = {};
      
      switch (type) {
        case 'link':
          const shareUrl = `${window.location.origin}/public/portfolio/${user.id}`;
          await navigator.clipboard.writeText(shareUrl);
          setShareMessage('Read-only portfolio link copied! Recipients can only view.');
          break;
          
        case 'email':
          const subject = `${user.name}'s Digital Portfolio`;
          const body = `Check out my comprehensive academic portfolio: ${window.location.origin}/portfolio/${user.id}`;
          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          setShareMessage('Email client opened!');
          break;
          
        case 'social':
          if (navigator.share) {
            await navigator.share({
              title: `${user.name}'s Portfolio`,
              text: `Check out my academic achievements and activities!`,
              url: `${window.location.origin}/portfolio/${user.id}`
            });
          } else {
            handleSharePortfolio('link');
          }
          break;
      }
      
      setTimeout(() => setShareMessage(''), 3000);
    } catch (error) {
      setShareMessage('Failed to share. Please try again.');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  const handleDownloadPDF = () => {
    generateEnhancedPDF();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionSkeleton rows={5} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading your portfolio..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="portfolio-content">
      {/* CV Details Section */}
      {!isReadOnly && (
        <div>
          <StudentCVForm user={user} />
        </div>
      )}

      {/* Enhanced Portfolio Header */}
      <div className="bg-blue-600 dark:bg-blue-900 text-white rounded-xl shadow-xl border border-blue-400 dark:border-blue-700/50 transition-all">
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center flex-wrap gap-2">
                <span className="text-2xl sm:text-3xl">🎓</span>
                <span>Digital Portfolio</span>
                {isReadOnly && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 sm:px-3 py-1 rounded-full font-semibold flex items-center shadow-md">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Read-Only
                  </span>
                )}
              </h1>
              <p className="text-white text-base sm:text-lg font-semibold drop-shadow-sm">{user.name}</p>
              <p className="text-blue-100 dark:text-blue-200 text-xs sm:text-sm">
                <span className="inline-block font-medium">{academicDisplay}</span>
                <span className="hidden sm:inline"> • </span>
                <span className="block sm:inline mt-1 sm:mt-0">Year {user.year} • ID: {user.studentId}</span>
              </p>
            </div>

            {/* Enhanced Action Buttons */}
            {!isReadOnly && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download CV
                  </>
                )}
              </button>

              {/* Enhanced Share Menu */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    const dropdown = e.currentTarget.nextElementSibling;
                    dropdown.classList.toggle('hidden');
                  }}
                  className="w-full bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu - Touch friendly */}
                <div className="share-dropdown hidden absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700 transition-colors">
                  <button
                    onClick={(e) => {
                      e.currentTarget.parentElement.classList.add('hidden');
                      handleSharePortfolio('link');
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center rounded-t-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copy Portfolio Link
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.parentElement.classList.add('hidden');
                      handleSharePortfolio('email');
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center border-t border-gray-100 dark:border-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Share via Email
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.parentElement.classList.add('hidden');
                      handleSharePortfolio('social');
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center rounded-b-lg border-t border-gray-100 dark:border-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    Social Media Share
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5 sm:mt-7">
            {[
              { value: stats?.byStatus?.approved || 0, label: "Approved Activities", icon: "✅", color: "text-green-600 dark:text-green-400" },
              { value: stats?.totalCredits || 0, label: "Total Credits", icon: "🏆", color: "text-amber-600 dark:text-amber-400" },
              { value: Object.keys(activityGroups).length, label: "Categories", icon: "📂", color: "text-blue-600 dark:text-blue-400" },
              { value: activities.length > 0 ? Math.round(stats?.totalCredits / activities.length * 10) / 10 : 0, label: "Avg Credits", icon: "📊", color: "text-teal-600 dark:text-teal-400" }
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-5 shadow-lg border border-white/20 dark:border-gray-700 hover:bg-opacity-100 hover:shadow-xl hover:-translate-y-1 transition-all transform"
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-3xl lg:text-4xl drop-shadow-sm">{stat.icon}</span>
                    <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activities Display */}
      {Object.keys(activityGroups).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(activityGroups).map(([type, typeActivities]) => (
            <section 
              key={type} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center flex-wrap gap-2">
                  <span className="text-2xl sm:text-3xl">{getActivityIcon(type)}</span>
                  <span>{getTypeLabel(type)}</span>
                  <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 px-2 sm:px-3 py-1 rounded-full shadow-sm transition-colors">
                    {typeActivities.length} {typeActivities.length === 1 ? 'Activity' : 'Activities'}
                  </span>
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {typeActivities.map((activity) => (
                    <article
                      key={activity.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all bg-white dark:bg-gray-800">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                        {activity.title}
                      </h3>

                      <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><strong className="font-semibold">Date:</strong> {new Date(activity.date).toLocaleDateString()}</span>
                        </div>
                        {activity.organizer && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="break-words"><strong className="font-semibold">Organizer:</strong> {activity.organizer}</span>
                          </div>
                        )}
                      </div>

                      {activity.description && (
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">{activity.description}</p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors">
                        <span className="inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all">
                          <svg className="w-4 h-4 mr-1.5 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {activity.credits} Credits
                        </span>
                        {activity.certificate && (
                          <span className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-semibold flex items-center justify-center sm:justify-start bg-green-50 dark:bg-green-900/30 px-2 sm:px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-700">
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Certificate Available
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center p-12 transition-colors">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-inner transition-colors">
            <span className="text-5xl">📋</span>
          </div>
          <h3 className="text-gray-800 dark:text-gray-200 text-xl font-semibold mb-2">No Approved Activities Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Start building your portfolio by submitting your first activity!</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">Activities will appear here once they are approved by faculty.</p>
        </div>
      )}

      {/* Share Message */}
      {shareMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center animate-fade-in border border-green-500">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{shareMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Portfolio;

