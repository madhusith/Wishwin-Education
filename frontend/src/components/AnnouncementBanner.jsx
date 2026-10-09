import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  X,
  Pause,
  Play,
  Volume2,
} from 'lucide-react';
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
  const [isPaused, setIsPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right');
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

      if (userRole && a.target_type && a.target_type !== 'ALL') {
        if (userRole === 'STUDENT' && !['STUDENTS', 'CLASS'].includes(a.target_type)) return false;
        if (userRole === 'TEACHER' && a.target_type !== 'TEACHERS') return false;
        if (userRole === 'PARENT' && a.target_type !== 'PARENTS') return false;
      }

      if (a.priority === 'URGENT') return true;
      return !dismissedIds.includes(a.id);
    })
    .sort((a, b) => {
      const priorityWeights = { URGENT: 3, IMPORTANT: 2, NORMAL: 1 };
      const weightDiff = (priorityWeights[b.priority] || 1) - (priorityWeights[a.priority] || 1);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  // Automatic sliding timer (every 5 seconds, pauses on hover)
  useEffect(() => {
    if (activeAnnouncements.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setSlideDirection('right');
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeAnnouncements.length, isPaused]);

  if (loading || activeAnnouncements.length === 0) {
    return null;
  }

  const safeIndex = currentIndex >= activeAnnouncements.length ? 0 : currentIndex;
  const current = activeAnnouncements[safeIndex];
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
    setSlideDirection('right');
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  const prevAnnouncement = () => {
    setSlideDirection('left');
    setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  // Enhanced priority styles with rich gradients, glow, and elevated height
  const styleConfig = {
    URGENT: {
      container: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-500/20 border border-red-400/30',
      badge: 'bg-white/20 text-white border border-white/30 font-black',
      iconBox: 'bg-white/20 text-white shadow-inner',
      accentDot: 'bg-rose-300',
      icon: AlertCircle,
    },
    IMPORTANT: {
      container: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/20 border border-amber-300/30',
      badge: 'bg-white/20 text-white border border-white/30 font-bold',
      iconBox: 'bg-white/20 text-white shadow-inner',
      accentDot: 'bg-amber-200',
      icon: Megaphone,
    },
    NORMAL: {
      container: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-xl shadow-blue-500/20 border border-blue-400/30',
      badge: 'bg-white/15 text-white border border-white/25 font-bold',
      iconBox: 'bg-white/15 text-white shadow-inner',
      accentDot: 'bg-sky-300',
      icon: Bell,
    },
  };

  const currentStyle = styleConfig[current.priority] || styleConfig.NORMAL;
  const CurrentIcon = currentStyle.icon;

  return (
    <div
      role="region"
      aria-label="Active announcements"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full rounded-2xl transition-all duration-300 overflow-hidden ${currentStyle.container} ${className}`}
    >
      {/* Increased height container with generous padding (py-5 sm:py-6 px-6 sm:px-8) */}
      <div className="px-5 py-5 sm:px-7 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Large Icon Badge & Elevated Content */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
          {/* Prominent Icon Box */}
          <div className={`p-3 sm:p-3.5 rounded-2xl shrink-0 backdrop-blur-md flex items-center justify-center ${currentStyle.iconBox}`}>
            <CurrentIcon className="w-6 h-6 text-white animate-pulse" />
          </div>

          {/* Animated Announcement Content */}
          <div key={current.id} className="min-w-0 flex-1 space-y-1.5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] uppercase px-2.5 py-0.5 rounded-full tracking-wider ${currentStyle.badge}`}>
                {current.priority === 'URGENT' ? '🔴 URGENT NOTICE' : current.priority === 'IMPORTANT' ? '⚡ IMPORTANT' : '📢 NOTICE'}
              </span>

              {current.className && (
                <span className="text-xs font-semibold text-white/90 bg-black/20 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                  {current.className}
                </span>
              )}

              {activeAnnouncements.length > 1 && (
                <span className="text-[11px] font-medium text-white/75 bg-black/15 px-2 py-0.5 rounded-md hidden sm:inline-block">
                  Auto-sliding {isPaused ? '(Paused on hover)' : ''}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-snug tracking-tight">
                {current.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-white/95 font-normal leading-relaxed max-w-4xl">
                {current.message}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Controls, Dots, & Dismiss Button */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/15">
          {activeAnnouncements.length > 1 && (
            <div className="flex items-center gap-2">
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-xl backdrop-blur-xs">
                {activeAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === safeIndex
                        ? 'w-6 bg-white shadow-xs'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Jump to announcement ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 backdrop-blur-xs text-white">
                <button
                  onClick={prevAnnouncement}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition focus:outline-hidden"
                  aria-label="Previous announcement"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-1 text-xs font-bold tabular-nums select-none">
                  {safeIndex + 1}/{activeAnnouncements.length}
                </span>
                <button
                  onClick={nextAnnouncement}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition focus:outline-hidden"
                  aria-label="Next announcement"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Dismiss button (for non-urgent notices) */}
          {current.priority !== 'URGENT' && (
            <button
              onClick={() => handleDismiss(current.id)}
              className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition focus:outline-hidden"
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
