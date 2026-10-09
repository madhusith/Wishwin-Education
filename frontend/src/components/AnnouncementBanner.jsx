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

  // Simple, calm priority pill styling (no harsh backgrounds, easy on the eyes)
  const priorityConfig = {
    URGENT: {
      badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
      badgeLabel: 'URGENT',
      iconBox: 'bg-rose-500/15 text-rose-300 border-rose-400/25',
      icon: AlertCircle,
    },
    IMPORTANT: {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      badgeLabel: 'IMPORTANT',
      iconBox: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
      icon: Megaphone,
    },
    NORMAL: {
      badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      badgeLabel: 'NOTICE',
      iconBox: 'bg-blue-500/15 text-blue-300 border-blue-400/25',
      icon: Bell,
    },
  };

  const currentPriority = priorityConfig[current.priority] || priorityConfig.NORMAL;
  const CurrentIcon = currentPriority.icon;

  return (
    <div
      role="region"
      aria-label="Active announcements"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative group w-full ${className}`}
    >
      {/* Glowing small frame around the banner */}
      <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r from-blue-500/40 via-indigo-500/50 to-cyan-400/40 blur-[3px] opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />

      {/* Main banner card: calm, simple Wishwin navy with glowing border */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#0A1A3F] via-[#0E2456] to-[#0A1A3F] border border-blue-400/40 shadow-lg shadow-blue-950/30 text-white overflow-hidden transition-all duration-300">
        <div className="px-5 py-4.5 sm:px-7 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Icon & Content */}
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            {/* Simple calm icon box */}
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 border flex items-center justify-center ${currentPriority.iconBox}`}>
              <CurrentIcon className="w-5 h-5" />
            </div>

            {/* Announcement text */}
            <div key={current.id} className="min-w-0 flex-1 space-y-1 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentPriority.badge}`}>
                  {currentPriority.badgeLabel}
                </span>

                {current.className && (
                  <span className="text-xs font-medium text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                    {current.className}
                  </span>
                )}

                {activeAnnouncements.length > 1 && (
                  <span className="text-[11px] font-normal text-slate-400 hidden sm:inline-block">
                    {isPaused ? '• Paused' : '• Auto-sliding'}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm sm:text-base text-white tracking-tight">
                  {current.title}
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 md:line-clamp-none max-w-4xl">
                  {current.message}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Simple Navigation Controls */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center gap-2.5">
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                  {activeAnnouncements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === safeIndex
                          ? 'w-5 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                          : 'w-1.5 bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Jump to announcement ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Prev / Next Arrows */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10 text-slate-300">
                  <button
                    onClick={prevAnnouncement}
                    className="p-1 rounded hover:bg-white/15 hover:text-white transition focus:outline-hidden"
                    aria-label="Previous announcement"
                    title="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-1 text-[11px] font-medium tabular-nums select-none text-slate-400">
                    {safeIndex + 1}/{activeAnnouncements.length}
                  </span>
                  <button
                    onClick={nextAnnouncement}
                    className="p-1 rounded hover:bg-white/15 hover:text-white transition focus:outline-hidden"
                    aria-label="Next announcement"
                    title="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Dismiss button */}
            {current.priority !== 'URGENT' && (
              <button
                onClick={() => handleDismiss(current.id)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition focus:outline-hidden"
                aria-label="Dismiss announcement"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
