'use client';
import React, { useState, useEffect } from 'react';
import LoginForm from '../auth/LoginForm';
import RegisterForm from '../auth/RegisterForm';

const LoginPageUI = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: "📚", text: "Track Academic Activities", color: "text-blue-600" },
    { icon: "🎯", text: "Build Digital Portfolio", color: "text-green-600" },
    { icon: "📊", text: "Analytics & Reports", color: "text-purple-600" },
    { icon: "🏆", text: "Achievement Management", color: "text-orange-600" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full opacity-10 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fadeInDown">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-0 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-500 hover:scale-110 hover:rotate-12 cursor-pointer">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
              Smart Student Hub
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 font-light tracking-wide">
            Your comprehensive platform for academic excellence
          </p>

          {/* Rotating Features */}
          <div className="h-16 flex items-center justify-center mb-2">
            <div className="flex items-center space-x-3 transition-all duration-700 animate-fadeIn">
              <span className="text-4xl transform hover:scale-125 transition-transform duration-300">{features[currentFeature].icon}</span>
              <span className={`text-xl font-semibold ${features[currentFeature].color} transition-all duration-700 tracking-wide`}>
                {features[currentFeature].text}
              </span>
            </div>
          </div>

          <div className="flex justify-center space-x-3 mt-1">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`rounded-full transition-all duration-500 hover:scale-125 ${
                  index === currentFeature
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-3 shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-600 w-3 h-3 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Test Credentials Banner */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fadeInUp">
        <div className="group bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-amber-900/30 border-2 border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 mb-4 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40">
                <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">🧪 Test Credentials</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">For Demo & Testing Only</p>
              <div className="mt-4 space-y-3">
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 font-mono text-xs border border-amber-200/50 dark:border-amber-700/30">
                  <p className="font-bold text-red-600 dark:text-red-400 mb-1">👑 Admin Account</p>
                  <p className="text-gray-700 dark:text-gray-300">📧 <span className="font-semibold text-gray-900 dark:text-gray-100">arpan@smartstudenthub.com</span></p>
                  <p className="text-gray-700 dark:text-gray-300">🔑 <span className="font-semibold text-gray-900 dark:text-gray-100">Arpan@123.</span></p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 font-mono text-xs border border-amber-200/50 dark:border-amber-700/30">
                  <p className="font-bold text-blue-600 dark:text-blue-400 mb-1">👨‍🎓 Student Account</p>
                  <p className="text-gray-700 dark:text-gray-300">📧 <span className="font-semibold text-gray-900 dark:text-gray-100">student@gmail.com</span></p>
                  <p className="text-gray-700 dark:text-gray-300">🔑 <span className="font-semibold text-gray-900 dark:text-gray-100">Student@123.</span></p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 font-mono text-xs border border-amber-200/50 dark:border-amber-700/30">
                  <p className="font-bold text-green-600 dark:text-green-400 mb-1">👨‍🏫 Teacher Account</p>
                  <p className="text-gray-700 dark:text-gray-300">📧 <span className="font-semibold text-gray-900 dark:text-gray-100">teacher@gmail.com</span></p>
                  <p className="text-gray-700 dark:text-gray-300">🔑 <span className="font-semibold text-gray-900 dark:text-gray-100">Teacher@123.</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-12 border-2 border-white/30 dark:border-gray-700/30 hover:shadow-3xl transition-all duration-500">
          {/* Toggle */}
          <div className="flex mb-8 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-center text-sm font-bold rounded-lg transition-all duration-300 uppercase tracking-wider ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-center text-sm font-bold rounded-lg transition-all duration-300 uppercase tracking-wider ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>

          <div className="transition-all duration-500 animate-fadeIn">
            {isLogin ? (
              <LoginForm onLogin={onLogin} onSwitchToRegister={() => setIsLogin(false)} />
            ) : (
              <RegisterForm onLogin={onLogin} onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </div>
        </div>

        {/* System Stats */}
        <div className="mt-8 bg-gradient-to-br from-white/70 to-gray-50/70 dark:from-gray-800/70 dark:to-gray-900/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border-2 border-white/30 dark:border-gray-700/30">
          <h3 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Trusted Platform</h3>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8 font-medium">Empowering students nationwide</p>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: '500+', label: 'Active Students', color: 'from-blue-600 to-blue-500' },
              { value: '1200+', label: 'Activities Tracked', color: 'from-green-600 to-emerald-500' },
              { value: '50+', label: 'Institutions', color: 'from-purple-600 to-pink-500' },
            ].map((stat) => (
              <div key={stat.label} className="group flex flex-col items-center p-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300`}>{stat.value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {[
            { icon: "🔒", title: "Secure", desc: "Bank-level encryption", color: "from-red-500 to-pink-500" },
            { icon: "⚡", title: "Fast", desc: "Lightning responses", color: "from-yellow-500 to-orange-500" },
            { icon: "📱", title: "Mobile", desc: "Works everywhere", color: "from-blue-500 to-cyan-500" },
            { icon: "🎯", title: "Smart", desc: "AI-powered insights", color: "from-purple-500 to-pink-500" }
          ].map((benefit, index) => (
            <div
              key={benefit.title}
              className={`bg-gradient-to-br ${benefit.color} group rounded-xl p-4 text-center border-2 border-white/20 hover:border-white/60 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">{benefit.icon}</div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">{benefit.title}</div>
              <div className="text-xs text-white/80 font-medium">{benefit.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-4">
            <div className="flex justify-center items-center space-x-3">
              <span className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></span>
              <span className="font-medium tracking-wide">System Status: All services operational</span>
            </div>
            <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-3">© 2025 Smart Student Hub. All rights reserved.</p>
              <div className="flex justify-center items-center space-x-6 text-xs pt-4 border-t border-gray-300 dark:border-gray-600">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">v2.0.0 (Next.js)</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageUI;
