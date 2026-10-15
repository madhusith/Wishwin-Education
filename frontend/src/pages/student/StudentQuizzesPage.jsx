import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Search,
  FileQuestion,
  Award,
  Sparkles,
  Link as LinkIcon,
  Play,
  RotateCcw,
  CheckSquare,
  AlertCircle,
  X,
} from 'lucide-react';

export default function StudentQuizzesPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [reviewQuiz, setReviewQuiz] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizzesRes, classesRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/classes'),
      ]);
      setQuizzes(quizzesRes.data?.data || []);
      setClasses(classesRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err.response?.data?.message || 'Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (quiz) => {
    setReviewQuiz(quiz);
    setLoadingReview(true);
    try {
      const res = await api.get(`/quizzes/${quiz.id}/my-attempt`);
      setReviewData(res.data?.data);
    } catch (err) {
      console.error('Error fetching attempt review:', err);
      alert('Failed to load your previous attempt results.');
    } finally {
      setLoadingReview(false);
    }
  };

  // Metrics
  const completedCount = quizzes.filter((q) => q.myAttempt).length;
  const pendingCount = quizzes.length - completedCount;
  const avgScore =
    completedCount > 0
      ? Math.round(
          quizzes
            .filter((q) => q.myAttempt)
            .reduce((sum, q) => sum + q.myAttempt.percentage, 0) / completedCount
        )
      : 0;

  // Filtered
  const filteredQuizzes = quizzes.filter((q) => {
    const matchClass = !selectedClassId || String(q.classId) === String(selectedClassId);
    const matchSearch =
      !searchQuery.trim() ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchClass && matchSearch;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Online Quizzes & Assessments"
        subtitle="Practice scholarship questions, test your speed, and review instant automated results."
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider border border-emerald-200">
            Student Practice
          </span>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Quizzes</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{quizzes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Average Score</p>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {completedCount > 0 ? `${avgScore}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Enrolled Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <LoadingSpinner message="Loading your quizzes..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : filteredQuizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No Quizzes Available"
          description={
            searchQuery || selectedClassId
              ? 'No quizzes match your selected filter.'
              : 'There are no active quizzes published for your enrolled classes right now.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => {
            const hasLmsQuiz =
              quiz.quizType === 'IN_BUILD' || quiz.quizType === 'BOTH' || quiz.questionCount > 0;
            const hasGoogleForm =
              Boolean(quiz.googleFormUrl) && quiz.googleFormUrl.trim().length > 0;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  {/* Top class badge & attempt badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {quiz.className}
                    </span>
                    {quiz.myAttempt ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {quiz.myAttempt.percentage}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Not Attempted
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Format Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                    {quiz.quizType === 'IN_BUILD' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Sparkles className="w-3 h-3 text-blue-600" /> LMS In-Built
                      </span>
                    )}
                    {quiz.quizType === 'GOOGLE_FORM' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <LinkIcon className="w-3 h-3 text-amber-600" /> Google Form
                      </span>
                    )}
                    {quiz.quizType === 'BOTH' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <CheckSquare className="w-3 h-3 text-purple-600" /> Dual Format (LMS + Google Form)
                      </span>
                    )}

                    {quiz.timeLimitMinutes > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" /> {quiz.timeLimitMinutes} mins
                      </span>
                    )}
                  </div>

                  {/* Info Row */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                      <span>{quiz.questionCount} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>{quiz.totalMarks} Total Marks</span>
                    </div>
                  </div>

                  {/* Previous Attempt Summary if completed */}
                  {quiz.myAttempt && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                      <span className="text-xs text-emerald-900 font-bold">
                        Score: {quiz.myAttempt.score} / {quiz.myAttempt.totalMarks}
                      </span>
                      <button
                        onClick={() => handleOpenReview(quiz)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                      >
                        Review Answers
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons (Direct User Requirement: 2 buttons if teacher provided Google Form link, hidden if not!) */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-2">
                  {/* Button 1: LMS In-Built Quiz Button */}
                  {hasLmsQuiz && (
                    <Link
                      to={`/student/quizzes/${quiz.id}/attempt`}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs ${
                        quiz.myAttempt
                          ? 'bg-slate-800 hover:bg-slate-900 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {quiz.myAttempt ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Re-attempt LMS Quiz
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          Take LMS In-Built Quiz
                        </>
                      )}
                    </Link>
                  )}

                  {/* Button 2: Google Form Quiz Button (ONLY DISPLAYED IF TEACHER PROVIDED A GOOGLE FORM LINK) */}
                  {hasGoogleForm && (
                    <a
                      href={quiz.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Open Google Form Quiz
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STUDENT ATTEMPT REVIEW MODAL */}
      {reviewQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Review Results: {reviewQuiz.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed review of your selected choices and correct answers.
                </p>
              </div>
              <button
                onClick={() => setReviewQuiz(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingReview ? (
                <LoadingSpinner message="Loading your attempt answers..." />
              ) : reviewData ? (
                <>
                  {/* Score Highlight Box */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Your Score</p>
                      <p className="text-2xl font-black text-emerald-700 mt-0.5">
                        {reviewData.score} / {reviewData.totalMarks}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600">
                        {reviewData.percentage}%
                      </span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Submitted: {new Date(reviewData.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Answers breakdown */}
                  <div className="space-y-3 pt-2">
                    {reviewData.answers.map((ans, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border ${
                          ans.isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-red-50/40 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">
                            Question #{idx + 1}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              ans.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {ans.isCorrect ? `+${ans.marksAwarded} Marks` : '0 Marks'}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-900 mb-2">
                          {ans.questionText}
                        </p>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Your Answer:</span>
                            <span
                              className={`font-bold ${
                                ans.isCorrect ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {ans.selectedOptionText || '(Unanswered)'}
                            </span>
                          </div>

                          {!ans.isCorrect && ans.correctOptionText && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 font-medium">Correct Answer:</span>
                              <span className="font-bold text-emerald-700">
                                {ans.correctOptionText}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="No Review Available" description="Could not load your attempt." />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
