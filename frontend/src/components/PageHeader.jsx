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
    <div className={`mb-6 pb-4 border-b border-slate-200/80 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-blue-600 transition font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D] tracking-tight">
              {title}
            </h1>
            {badge && (
              <div>{badge}</div>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
