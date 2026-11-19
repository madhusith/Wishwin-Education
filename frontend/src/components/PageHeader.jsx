import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions,
  className = '',
}) {
  return (
    <div className={`mb-5 sm:mb-6 pb-4 border-b border-slate-200/80 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-blue-600 transition font-medium truncate max-w-[160px] sm:max-w-none"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-none">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0B1F4D] tracking-tight break-words">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
