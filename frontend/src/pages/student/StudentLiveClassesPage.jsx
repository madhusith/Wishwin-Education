import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  Video,
  Calendar,
  Clock,
  Radio,
  ExternalLink,
  GraduationCap,
  Play,
  CheckCircle,
  AlertCircle,
  X,
  Volume2,
  Mic,
  Tv,
} from 'lucide-react';
import api from '../../services/api';

export default function StudentLiveClassesPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Live Classroom Modal
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTokenData, setSessionTokenData] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/live-classes');
      if (res.data?.data) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student live classes:', err);
      setError(err.response?.data?.message || 'Failed to load your live classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const handleJoinClass = async (session) => {
    try {
      setJoining(true);
      setJoinError(null);
      setActiveSession(session);

      const res = await api.post('/live/token', { liveClassId: session.id });
      const data = res.data;
      setSessionTokenData(data);

      if (data.provider === 'ZOOM' && data.meetingUrl) {
        window.open(data.meetingUrl, '_blank', 'noopener,noreferrer');
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to join live session:', err);
      setJoinError(err.response?.data?.message || 'Could not join session. Please check your enrollment.');
    } finally {
      setJoining(false);
    }
  };

  const closeLiveRoom = () => {
    setActiveSession(null);
    setSessionTokenData(null);
    setJoinError(null);
  };

  const liveNow = sessions.filter((s) => s.status === 'LIVE');
  const upcoming = sessions.filter((s) => s.status === 'SCHEDULED');
  const past = sessions.filter((s) => ['COMPLETED', 'CANCELLED'].includes(s.status));

  return (
    <DashboardLayout>
      <PageHeader
        title="Live Classes"
        subtitle="Join interactive live sessions with your teacher and classmates for your enrolled subjects."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Live Classes' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchLiveClasses} className="mb-4" />}

      {/* LIVE NOW SPOTLIGHT (if active) */}
      {liveNow.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            Live Right Now
          </div>

          <div className="grid grid-cols-1 gap-4">
            {liveNow.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-6 shadow-lg shadow-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-red-700 tracking-wider">
                      🔴 LIVE STREAMING
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {item.gradeName} &bull; {item.className}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white leading-tight">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/90">
                    <span className="flex items-center gap-1.5 font-medium">
                      <GraduationCap className="w-4 h-4 text-white/80" />
                      Teacher: {item.teacherName}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-white/80" />
                      {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinClass(item)}
                  className="px-6 py-3 rounded-xl bg-white text-red-600 hover:bg-red-50 font-extrabold text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Join Class Now</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Classes */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Upcoming Scheduled Classes
        </h3>

        {loading ? (
          <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
            <LoadingSpinner message="Loading live classes..." />
          </div>
        ) : upcoming.length === 0 && liveNow.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No upcoming live classes"
            description="You don't have any scheduled live sessions today. Check your announcements for weekly updates."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.gradeName} &bull; {item.className}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      ⏰ SCHEDULED
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base leading-snug">
                    {item.title}
                  </h4>

                  {item.description && (
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(item.scheduledDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleJoinClass(item)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Join Class</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Classroom Viewer Modal (Step G3) */}
      {activeSession && sessionTokenData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={closeLiveRoom} />

          <div className="relative bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-800 z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-xl">
                  <Radio className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {activeSession.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeSession.gradeName} &bull; {activeSession.className} &bull; Teacher {activeSession.teacherName}
                  </p>
                </div>
              </div>
              <button
                onClick={closeLiveRoom}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Exit live room"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Container Area */}
            <div className="mt-5 aspect-video w-full bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-4">
                <Tv className="w-8 h-8" />
              </div>

              <h4 className="text-lg font-bold text-white">
                Live Classroom Session
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Room: <code>{sessionTokenData.roomName}</code>
              </p>

              {sessionTokenData.isSandbox && (
                <div className="mt-4 px-3 py-1.5 rounded-xl bg-blue-900/40 border border-blue-700/50 text-[11px] text-sky-200">
                  ⚡ LiveKit Cloud provider connected. Token generated for student.
                </div>
              )}

              {/* In-classroom mock controls */}
              <div className="absolute bottom-4 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700">
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <Mic className="w-3.5 h-3.5" /> Mic Ready
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
                  <Volume2 className="w-3.5 h-3.5" /> Audio Connected
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Status: <strong className="text-emerald-400">Enrolled & Connected</strong>
              </span>
              <button
                onClick={closeLiveRoom}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition"
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
