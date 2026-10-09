import React from 'react';

export default function LoadingSpinner({
  size = 'md',
  message = 'Loading...',
  fullScreen = false,
  className = '',
}) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size] || sizeMap.md} rounded-full border-blue-200 border-t-blue-600 animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-xs font-medium text-slate-500 tracking-wide select-none">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs">
        <div className="bg-white px-8 py-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}
