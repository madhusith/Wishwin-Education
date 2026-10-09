import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  action,
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center transition ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-500 mb-4 shadow-2xs">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-md">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
