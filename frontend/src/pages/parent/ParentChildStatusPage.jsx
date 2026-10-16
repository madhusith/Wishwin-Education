import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { Award, Video, Calendar, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';

export default function ParentChildStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/parent/child-summary');
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching academic status:', err);
      setError('Failed to load child academic status.');
    } finally {
      setLoading(false);
    }
  };

  const child = data?.child;
  const quizAttempts = data?.quizAttempts || [];
  const liveClasses = data?.liveClasses || [];
  const stats = data?.stats || { avgScorePercentage: 0, quizzesAttemptedCount: 0 };

  return (
    <DashboardLayout>
      <PageHeader
        title="Child Academic Status & Marks"
        subtitle={`Track online quiz performance, scores, and live class attendance for ${child?.name || 'your child'}.`}
        breadcrumbs={[
          { label: 'Parent', href: '/parent/dashboard' },
          { label: 'Academic Status' },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {loading ? (
        <LoadingSpinner message="Loading academic status..." />
      ) : !child ? (
        <EmptyState
          icon={Award}
          title="No Academic Records"
          description="No linked student records found."
        />
      ) : (
        <div className="space-y-5">
          {/* Top Simple Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Average Score</span>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                {stats.avgScorePercentage}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Quizzes Completed</span>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.quizzesAttemptedCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Live Sessions</span>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">
                {liveClasses.length}
              </p>
            </div>
          </div>

          {/* SECTION 1: QUIZ MARKS & RESULTS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Online Quiz Marks & Assessment Results
              </h3>
              <span className="text-xs text-slate-500">
                Total Attempts: {quizAttempts.length}
              </span>
            </div>

            {quizAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No quizzes attempted by the student yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-2">Quiz Title</th>
                      <th className="pb-2">Class</th>
                      <th className="pb-2 text-center">Score</th>
                      <th className="pb-2 text-center">Percentage</th>
                      <th className="pb-2 text-right">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quizAttempts.map((attempt) => (
                      <tr key={attempt.attemptId} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{attempt.quizTitle}</td>
                        <td className="py-2.5 text-slate-600">{attempt.className}</td>
                        <td className="py-2.5 text-center font-bold text-blue-600">
                          {attempt.score} / {attempt.totalMarks}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                              attempt.percentage >= 75
                                ? 'bg-emerald-50 text-emerald-700'
                                : attempt.percentage >= 50
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {attempt.percentage}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-400">
                          {new Date(attempt.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: LIVE SESSIONS & ATTENDANCE */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                Live Classes & Attendance Status
              </h3>
            </div>

            <div className="space-y-2.5">
              {liveClasses.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No live sessions found.</p>
              ) : (
                liveClasses.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{session.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            session.status === 'LIVE'
                              ? 'bg-red-100 text-red-700 animate-pulse'
                              : session.status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {session.status === 'LIVE'
                            ? '● LIVE NOW'
                            : session.status === 'SCHEDULED'
                            ? 'Scheduled'
                            : 'Completed'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {session.className} &bull; Teacher: {session.teacherName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-slate-700">
                          {new Date(session.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {session.startTime.substring(0, 5)} - {session.endTime.substring(0, 5)}
                        </p>
                      </div>

                      {session.status === 'LIVE' && session.meetingUrl && (
                        <a
                          href={session.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs flex items-center gap-1"
                        >
                          Join <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
