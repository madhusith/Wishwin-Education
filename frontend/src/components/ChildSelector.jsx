import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ChildSelector({
  childrenList = [],
  selectedChildId,
  onSelect,
  className = '',
}) {
  const { t } = useLanguage();

  if (!childrenList || childrenList.length === 0) return null;

  const currentChild =
    childrenList.find((c) => String(c.id) === String(selectedChildId)) || childrenList[0];

  const handleChange = (e) => {
    const val = e.target.value;
    try {
      localStorage.setItem('wishwin_parent_selected_child_id', val);
    } catch (e) {
      // Ignore storage errors
    }
    if (onSelect) {
      onSelect(val);
    }
  };

  return (
    <div
      className={`bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-5 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <User className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('parentSelectChild', 'Viewing Child Profile')}
          </span>
          <p className="font-bold text-slate-800 text-xs sm:text-sm">
            {currentChild?.name || 'Child'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="text-slate-500 font-medium text-[11px] hidden sm:inline">
          {t('parentSelectChild', 'Switch Child')}:
        </span>
        <div className="relative">
          <select
            value={selectedChildId || currentChild?.id || ''}
            onChange={handleChange}
            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer shadow-2xs"
          >
            {childrenList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.email ? `(${c.email.split('@')[0]})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}
