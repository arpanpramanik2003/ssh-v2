'use client';
import React from 'react';

const LoadingSpinner = ({
  size = 'md',
  className = '',
  text = '',
  variant = 'pulse-ring',
  overlay = false
}) => {
  const sizeMap = {
    xs: { container: 'w-5 h-5', border: 'border-[2px]', dot: 'w-1 h-1', gap: 'gap-1' },
    sm: { container: 'w-8 h-8', border: 'border-2', dot: 'w-1.5 h-1.5', gap: 'gap-1.5' },
    md: { container: 'w-12 h-12', border: 'border-[3px]', dot: 'w-2 h-2', gap: 'gap-2' },
    lg: { container: 'w-16 h-16', border: 'border-[3px]', dot: 'w-2.5 h-2.5', gap: 'gap-2' },
    xl: { container: 'w-20 h-20', border: 'border-4', dot: 'w-3 h-3', gap: 'gap-2.5' }
  };

  const textSizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm',
    xl: 'text-base'
  };

  const s = sizeMap[size] || sizeMap.md;

  const SpinnerVariants = {
    // Clean arc spinner — most professional default
    'pulse-ring': (
      <div className={`relative ${s.container}`}>
        <div className={`absolute inset-0 rounded-full ${s.border} border-slate-200 dark:border-slate-700`} />
        <div className={`absolute inset-0 rounded-full ${s.border} border-transparent border-t-blue-600 dark:border-t-blue-400 loader-arc-spin`} />
      </div>
    ),

    // Dual ring — elegant intersecting rings
    'dual-ring': (
      <div className={`relative ${s.container}`}>
        <div className={`absolute inset-0 rounded-full ${s.border} border-transparent border-t-blue-600 border-b-blue-600 dark:border-t-blue-400 dark:border-b-blue-400 loader-arc-spin`} />
        <div className={`absolute inset-[3px] rounded-full ${s.border} border-transparent border-l-indigo-500 border-r-indigo-500 dark:border-l-indigo-400 dark:border-r-indigo-400 loader-arc-spin-reverse`} />
      </div>
    ),

    // Skeleton dots — subtle staggered fade
    dots: (
      <div className={`flex items-center ${s.gap}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${s.dot} rounded-full bg-blue-600 dark:bg-blue-400 loader-dot`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    ),

    // Progress bar shimmer — great for inline use
    bar: (
      <div className="w-full max-w-[120px]">
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full loader-bar-shimmer" />
        </div>
      </div>
    ),

    // Skeleton pulse — for content placeholders
    skeleton: (
      <div className="w-full space-y-3 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      </div>
    ),
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {SpinnerVariants[variant] || SpinnerVariants['pulse-ring']}
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-slate-500 dark:text-slate-400 tracking-wide`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
};

// ─── Branded Full-Page Loader (initial load / auth gate) ────────────
export const BrandedLoader = ({ text = '' }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-6 transition-colors">
    {/* Logo mark */}
    <div className="relative flex items-center justify-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      {/* Pulse ring behind logo */}
      <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-blue-600/20 dark:bg-blue-400/10 loader-logo-pulse" />
    </div>
    {/* Brand name */}
    <div className="flex flex-col items-center gap-2">
      <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
        Smart Student Hub
      </h1>
      {/* Loading bar */}
      <div className="w-32 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 rounded-full loader-bar-shimmer" />
      </div>
      {text && (
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 tracking-wide">{text}</p>
      )}
    </div>
  </div>
);

// ─── Section / Page Content Loader ──────────────────────────────────
export const PageLoader = ({ text = 'Loading...', variant = 'pulse-ring' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <LoadingSpinner size="lg" variant={variant} />
    <p className="text-sm font-medium text-slate-400 dark:text-slate-500 tracking-wide">{text}</p>
  </div>
);

// ─── Inline Section Skeleton ────────────────────────────────────────
export const SectionSkeleton = ({ rows = 3 }) => (
  <div className="w-full space-y-6 py-8 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${85 - i * 10}%` }} />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${70 - i * 5}%` }} />
      </div>
    ))}
  </div>
);

// ─── Card Grid Skeleton ─────────────────────────────────────────────
export const CardSkeleton = ({ cards = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      </div>
    ))}
  </div>
);

// ─── Table Skeleton ─────────────────────────────────────────────────
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full animate-pulse">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={`h-${i}`} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      ))}
    </div>
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Button Loader ──────────────────────────────────────────────────
export const ButtonLoader = ({ size = 'xs' }) => (
  <LoadingSpinner size={size} variant="pulse-ring" />
);

// ─── Inline Loader ──────────────────────────────────────────────────
export const InlineLoader = ({ text = 'Loading...' }) => (
  <LoadingSpinner size="sm" variant="dots" text={text} className="py-4" />
);

// ─── Overlay Loader ─────────────────────────────────────────────────
export const OverlayLoader = ({ text = 'Please wait...' }) => (
  <LoadingSpinner size="lg" variant="dual-ring" text={text} overlay={true} />
);

export default LoadingSpinner;