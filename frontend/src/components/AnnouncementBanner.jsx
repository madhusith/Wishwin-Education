import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, ChevronLeft, ChevronRight, Megaphone, X } from 'lucide-react';
import api from '../services/api';

export default function AnnouncementBanner({
  announcements: propAnnouncements,
  userRole,
  classId,
  className = '',
}) {
  const [announcements, setAnnouncements] = useState(propAnnouncements || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!propAnnouncements);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('wishwin_dismissed_announcements') || '[]');
    } catch {
      return [];
    }
  });

  // Fetch announcements if not provided as props
  useEffect(() => {
    if (propAnnouncements) {
      setAnnouncements(propAnnouncements);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const params = {};
        if (classId) params.classId = classId;
        const res = await api.get('/announcements', { params });
        if (isMounted && res.data && res.data.data) {
          setAnnouncements(res.data.data);
        }
      } catch (err) {
        // Silent fail for banner - avoid crashing UI if no announcements or offline
        console.warn('Failed to load announcements banner:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnnouncements();
    return () => {
      isMounted = false;
    };
  }, [propAnnouncements, classId]);

  // Filter out expired and dismissed (except URGENT announcements which can't be dismissed)
  const activeAnnouncements = announcements
    .filter((a) => {
      if (!a.active) return false;

      // Check date validity
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (a.start_date) {
        const start = new Date(a.start_date);
        start.setHours(0, 0, 0, 0);
        if (now < start) return false;
      }

      if (a.end_date) {
        const end = new Date(a.end_date);
        end.setHours(23, 59, 59, 999);
        if (now > end) return false;
      }

      // Check role/class targeting
      if (userRole && a.target_type && a.target_type !== 'ALL') {
        if (userRole === 'STUDENT' && !['STUDENTS', 'CLASS'].includes(a.target_type)) return false;
        if (userRole === 'TEACHER' && a.target_type !== 'TEACHERS') return false;
        if (userRole === 'PARENT' && a.target_type !== 'PARENTS') return false;
      }

      // Urgent ones cannot be permanently dismissed
      if (a.priority === 'URGENT') return true;

      return !dismissedIds.includes(a.id);
    })
    .sort((a, b) => {
      // 1. Highest priority first: URGENT > IMPORTANT > NORMAL
      const priorityWeights = { URGENT: 3, IMPORTANT: 2, NORMAL: 1 };
      const weightDiff = (priorityWeights[b.priority] || 1) - (priorityWeights[a.priority] || 1);
      if (weightDiff !== 0) return weightDiff;

      // 2. Latest announcement first within same priority
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  if (loading || activeAnnouncements.length === 0) {
    return null;
  }

  const current = activeAnnouncements[currentIndex >= activeAnnouncements.length ? 0 : currentIndex];
  if (!current) return null;

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('wishwin_dismissed_announcements', JSON.stringify(updated));
    } catch {
      // Ignore sessionStorage errors
    }
    if (currentIndex >= activeAnnouncements.length - 1) {
      setCurrentIndex(Math.max(0, activeAnnouncements.length - 2));
    }
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  const prevAnnouncement = () => {
    setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  // Priority styling
  const styleConfig = {
    URGENT: {
      container: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-500/10',
      badge: 'bg-white/20 text-white border border-white/30',
      pulse: 'bg-white',
      icon: AlertCircle,
    },
    IMPORTANT: {
      container: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/10',
      badge: 'bg-white/20 text-white border border-white/30',
      pulse: 'bg-amber-100',
      icon: Megaphone,
    },
    NORMAL: {
      container: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md shadow-blue-500/10',
      badge: 'bg-white/15 text-white border border-white/20',
      pulse: 'bg-sky-300',
      icon: Bell,
    },
  };

  const currentStyle = styleConfig[current.priority] || styleConfig.NORMAL;
  const CurrentIcon = currentStyle.icon;

  return (
    <div
      role="region"
      aria-label="Active announcements"
      className={`relative w-full rounded-xl sm:rounded-2xl transition-all duration-300 overflow-hidden ${currentStyle.container} ${className}`}
    >
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Left: Icon & Content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-white/15 shrink-0 backdrop-blur-xs flex items-center justify-center">
            <CurrentIcon className="w-5 h-5 text-white animate-pulse" />
          </div>

          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${currentStyle.badge}`}>
                {current.priority === 'URGENT' ? '🔴 URGENT' : current.priority === 'IMPORTANT' ? '⚡ IMPORTANT' : '📢 NOTICE'}
              </span>
              {current.className && (
                <span className="text-[11px] font-medium text-white/80 bg-black/15 px-2 py-0.5 rounded-md hidden md:inline-block">
                  {current.className}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs sm:text-sm text-white mr-2">
                {current.title}
              </span>
              <span className="text-xs text-white/90 font-normal line-clamp-1 sm:inline">
                {current.message}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {activeAnnouncements.length > 1 && (
            <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5 text-xs text-white/90">
              <button
                onClick={prevAnnouncement}
                className="p-1 rounded hover:bg-white/20 transition focus:outline-hidden"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-semibold tabular-nums select-none">
                {currentIndex + 1}/{activeAnnouncements.length}
              </span>
              <button
                onClick={nextAnnouncement}
                className="p-1 rounded hover:bg-white/20 transition focus:outline-hidden"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {current.priority !== 'URGENT' && (
            <button
              onClick={() => handleDismiss(current.id)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition focus:outline-hidden"
              aria-label="Dismiss announcement"
              title="Dismiss announcement for this session"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
