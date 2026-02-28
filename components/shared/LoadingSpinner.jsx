'use client';
import React from 'react';

const LoadingSpinner = ({
  size = 'md',
  className = '',
  text = '',
  variant = 'orbital',
  overlay = false
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const SpinnerVariants = {
    orbital: (
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-1/3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg" />
        </div>
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg" />
        </div>
        <div className="absolute inset-0 animate-spin-reverse" style={{ animationDuration: '1.5s' }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full shadow-lg" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-400 animate-spin" />
      </div>
    ),
    dots: (
      <div className="flex space-x-2 items-center">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ${
              size === 'xs' ? 'w-1.5 h-1.5' :
              size === 'sm' ? 'w-2 h-2' :
              size === 'md' ? 'w-3 h-3' :
              size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            }`}
            style={{ animation: `bounce 1.4s ease-in-out ${index * 0.15}s infinite` }}
          />
        ))}
      </div>
    ),
    helix: (
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: '2s', animationDelay: `${index * 0.2}s`, transform: `rotate(${index * 90}deg)` }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    cube: (
      <div className={`relative ${sizeClasses[size]} perspective-1000`}>
        <div className="relative w-full h-full animate-spin-3d" style={{ transformStyle: 'preserve-3d' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg opacity-80 shadow-2xl" />
          <div className="absolute inset-0 bg-gradient-to-tl from-pink-500 to-orange-500 rounded-lg opacity-60 shadow-2xl" style={{ transform: 'rotateY(90deg)' }} />
        </div>
      </div>
    ),
    ring: (
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 opacity-20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-cyan-400 border-l-green-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }} />
      </div>
    )
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {SpinnerVariants[variant] || SpinnerVariants.orbital}
      {text && (
        <p className={`text-gray-700 font-semibold ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
};

export const PageLoader = ({ text = 'Loading...' }) => (
  <LoadingSpinner size="lg" variant="orbital" text={text} className="py-20" />
);

export const ButtonLoader = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} variant="dots" />
);

export const InlineLoader = ({ text = 'Loading...' }) => (
  <LoadingSpinner size="sm" variant="dots" text={text} className="py-4" />
);

export const OverlayLoader = ({ text = 'Please wait...' }) => (
  <LoadingSpinner size="xl" variant="orbital" text={text} overlay={true} />
);

export default LoadingSpinner;
