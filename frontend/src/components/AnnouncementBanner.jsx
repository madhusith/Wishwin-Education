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

  // Priority pill styling tailored for light blue background
  const priorityConfig = {
    URGENT: {
      badge: 'bg-rose-500 text-white border-rose-300/40 shadow-xs',
      badgeLabel: 'URGENT',
      iconBox: 'bg-white/25 text-white border-white/30',
      icon: AlertCircle,
    },
    IMPORTANT: {
      badge: 'bg-amber-400 text-amber-950 border-amber-200/50 shadow-xs font-bold',
      badgeLabel: 'IMPORTANT',
      iconBox: 'bg-white/25 text-white border-white/30',
      icon: Megaphone,
    },
    NORMAL: {
      badge: 'bg-white/25 text-white border-white/35',
      badgeLabel: 'NOTICE',
      iconBox: 'bg-white/25 text-white border-white/30',
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
      <div className="absolute -inset-[1.5px] rounded-2xl bg-[#145dfb]/60 blur-[4px] opacity-80 group-hover:opacity-100 transition duration-500 pointer-events-none" />

      {/* Main banner card: Exact #145dfb blue with glowing border frame */}
      <div className="relative w-full rounded-2xl bg-[#145dfb] border border-blue-300/40 shadow-lg shadow-[#145dfb]/30 text-white overflow-hidden transition-all duration-300">
        <div className="px-5 py-4.5 sm:px-7 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Icon & Content */}
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            {/* Luminous icon box */}
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 border backdrop-blur-xs flex items-center justify-center ${currentPriority.iconBox}`}>
              <CurrentIcon className="w-5 h-5 text-white" />
            </div>

            {/* Announcement text */}
            <div key={current.id} className="min-w-0 flex-1 space-y-1 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentPriority.badge}`}>
                  {currentPriority.badgeLabel}
                </span>

                {current.className && (
                  <span className="text-xs font-semibold text-white bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {current.className}
                  </span>
                )}

                {activeAnnouncements.length > 1 && (
                  <span className="text-[11px] font-medium text-blue-100/90 hidden sm:inline-block">
                    {isPaused ? '• Paused' : '• Auto-sliding'}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight drop-shadow-xs">
                  {current.title}
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-blue-50/95 leading-relaxed line-clamp-2 md:line-clamp-none max-w-4xl font-normal">
                  {current.message}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Simple Navigation Controls */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/20">
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center gap-2.5">
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-black/15 rounded-lg border border-white/20 backdrop-blur-xs">
                  {activeAnnouncements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === safeIndex
                          ? 'w-5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                          : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Jump to announcement ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Prev / Next Arrows */}
                <div className="flex items-center gap-1 bg-black/15 rounded-lg p-0.5 border border-white/20 text-white backdrop-blur-xs">
                  <button
                    onClick={prevAnnouncement}
                    className="p-1 rounded hover:bg-white/20 transition focus:outline-hidden"
                    aria-label="Previous announcement"
                    title="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-1 text-[11px] font-semibold tabular-nums select-none text-white/90">
                    {safeIndex + 1}/{activeAnnouncements.length}
                  </span>
                  <button
                    onClick={nextAnnouncement}
                    className="p-1 rounded hover:bg-white/20 transition focus:outline-hidden"
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
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition focus:outline-hidden"
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
