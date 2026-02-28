'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { authAPI } from '../../utils/api';
import { USER_ROLES } from '../../utils/constants';
import { PROGRAM_CATEGORIES, getProgramsByCategory, getSpecializations } from '../../utils/programsData';
import LoadingSpinner from '../shared/LoadingSpinner';

const RegisterForm = ({ onLogin, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: USER_ROLES.STUDENT,
    programCategory: '', program: '', specialization: '',
    year: '', admissionYear: '', studentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const availablePrograms = useMemo(() => {
    if (!formData.programCategory) return [];
    return getProgramsByCategory(formData.programCategory);
  }, [formData.programCategory]);

  const availableSpecializations = useMemo(() => {
    if (!formData.programCategory || !formData.program) return [];
    return getSpecializations(formData.programCategory, formData.program);
  }, [formData.programCategory, formData.program]);

  const programDuration = useMemo(() => {
    const program = availablePrograms.find(p => p.degree === formData.program);
    return program ? program.duration : '';
  }, [availablePrograms, formData.program]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.programCategory) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters long'); return; }
    if (formData.role === USER_ROLES.STUDENT) {
      if (!formData.program || !formData.year || !formData.studentId) { setError('Program, Year and Student ID are required for students'); return; }
      if (!formData.specialization || formData.specialization.trim() === '') { setError('Specialization is mandatory for students'); return; }
      if (!formData.admissionYear) { setError('Admission year is mandatory for students'); return; }
    }
    setLoading(true);
    setError('');
    const submitData = { ...formData };
    if (submitData.role !== USER_ROLES.STUDENT) {
      delete submitData.program; delete submitData.specialization;
      delete submitData.year; delete submitData.admissionYear; delete submitData.studentId;
    } else {
      submitData.year = parseInt(submitData.year, 10);
      submitData.admissionYear = parseInt(submitData.admissionYear, 10);
    }
    try {
      const response = await authAPI.register(submitData);
      onLogin(response.user, response.token);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'programCategory') { newData.program = ''; newData.specialization = ''; }
      else if (name === 'program') { newData.specialization = ''; }
      return newData;
    });
    if (error) setError('');
  }, [error]);

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);

  const inputClass = "appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200";
  const selectClass = "appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center justify-center">
          <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors underline">
            Sign in
          </button>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>Full Name *</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="Enter your full name" />
            </div>
          </div>

          {/* Email */}
          <div className="sm:col-span-2">
            <label htmlFor="email" className={labelClass}>Email address *</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              </div>
              <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="Enter your email address" />
            </div>
          </div>

          {/* Password */}
          <div className="sm:col-span-2">
            <label htmlFor="password" className={labelClass}>Password *</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength="8" value={formData.password} onChange={handleChange} className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200" placeholder="Enter your password (min 6 chars)" />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button type="button" onClick={togglePasswordVisibility} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Must be at least 8 characters (uppercase, lowercase, number & symbol)</p>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className={labelClass}>Role *</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              </div>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className={selectClass}>
                <option value={USER_ROLES.STUDENT}>Student</option>
                <option value={USER_ROLES.FACULTY}>Faculty</option>
              </select>
            </div>
          </div>

          {/* Student Fields */}
          {formData.role === USER_ROLES.STUDENT && (
            <>
              <div className="sm:col-span-2">
                <label htmlFor="programCategory" className={labelClass}>Program Category *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <select id="programCategory" name="programCategory" required value={formData.programCategory} onChange={handleChange} className={selectClass}>
                    <option value="">Select Category</option>
                    {Object.entries(PROGRAM_CATEGORIES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.programCategory && (
                <div className="sm:col-span-2">
                  <label htmlFor="program" className={labelClass}>Program / Degree *</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    </div>
                    <select id="program" name="program" required value={formData.program} onChange={handleChange} className={selectClass}>
                      <option value="">Select Program</option>
                      {availablePrograms.map(prog => (
                        <option key={prog.degree} value={prog.degree}>{prog.degree} - {prog.name} ({prog.duration})</option>
                      ))}
                    </select>
                  </div>
                  {programDuration && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Duration: {programDuration}</p>}
                </div>
              )}

              {formData.program && (
                <div className="sm:col-span-2">
                  <label htmlFor="specialization" className={labelClass}>Specialization *</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    </div>
                    <select id="specialization" name="specialization" required value={formData.specialization} onChange={handleChange} className={selectClass}>
                      <option value="">Select Specialization</option>
                      {availableSpecializations.length > 0 ? (
                        availableSpecializations.map(spec => <option key={spec} value={spec}>{spec}</option>)
                      ) : (
                        <option value="General">General</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="year" className={labelClass}>Current Year *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 1v5M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <select id="year" name="year" required value={formData.year} onChange={handleChange} className={selectClass}>
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="admissionYear" className={labelClass}>Admission Year (Batch) *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <select id="admissionYear" name="admissionYear" required value={formData.admissionYear} onChange={handleChange} className={selectClass}>
                    <option value="">Select Admission Year</option>
                    {[2027,2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Year you were admitted to the program</p>
              </div>

              <div>
                <label htmlFor="studentId" className={labelClass}>Student ID *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <input id="studentId" name="studentId" type="text" required value={formData.studentId} onChange={handleChange} className={inputClass} placeholder="Enter your student ID" />
                </div>
              </div>
            </>
          )}

          {/* Faculty Fields */}
          {formData.role === USER_ROLES.FACULTY && (
            <>
              <div className="sm:col-span-1">
                <label htmlFor="programCategory" className={labelClass}>Program Category *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <select id="programCategory" name="programCategory" required value={formData.programCategory || ''} onChange={handleChange} className={selectClass}>
                    <option value="">Select Program Category</option>
                    {Object.entries(PROGRAM_CATEGORIES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">You will only approve activities from students in this category</p>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="department" className={labelClass}>Department</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <input id="department" name="department" type="text" value={formData.department || ''} onChange={handleChange} className={inputClass} placeholder="e.g. Computer Science (optional)" />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional - for display purposes only</p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Registration Error</h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform hover:scale-105">
            {loading ? (
              <><LoadingSpinner size="sm" className="mr-2" />Creating account...</>
            ) : (
              <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>Create account</>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">By creating an account, you agree to our terms of service and privacy policy</p>
      </div>
    </div>
  );
};

export default RegisterForm;
