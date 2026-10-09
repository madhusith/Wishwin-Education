import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}) {
  if (!message) return null;

  const displayMessage = typeof message === 'string' ? message : message?.message || 'Unexpected error occurred.';

  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50/80 p-4 text-red-900 shadow-xs flex items-start gap-3.5 ${className}`}
      role="alert"
    >
      <div className="p-1 rounded-lg bg-red-100 text-red-600 shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-red-900 leading-tight">
          {title}
        </h4>
        <p className="mt-1 text-xs text-red-700 leading-relaxed">
          {displayMessage}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-white border border-red-300 rounded-lg shadow-2xs hover:bg-red-50 hover:text-red-900 transition focus:outline-hidden focus:ring-2 focus:ring-red-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
