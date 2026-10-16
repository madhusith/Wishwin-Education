import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  HelpCircle,
  Clock,
  ExternalLink,
  Search,
  FileQuestion,
  Award,
  Link as LinkIcon,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';

export default function StudentQuizzesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      setError(err.response?.data?.message || 'Failed to load quizzes.');
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
      alert('Failed to load previous attempt results.');
    } finally {
      setLoadingReview(false);
    }
  };

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
        title={t('cardQuizzesTitle')}
        subtitle={t('cardQuizzesDesc')}
        breadcrumbs={[
          { label: t('roleStudent'), href: '/student/dashboard' },
          { label: t('navQuizzes') },
        ]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Clean Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Enrolled Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.gradeName ? `${c.gradeName} • ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <LoadingSpinner message="Loading your quizzes..." />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => {
            const hasLmsQuiz =
              quiz.quizType === 'IN_BUILD' || quiz.quizType === 'BOTH' || quiz.questionCount > 0;
            const hasGoogleForm =
              Boolean(quiz.googleFormUrl) && quiz.googleFormUrl.trim().length > 0;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="p-4">
                  {/* Class & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {quiz.className}
                    </span>
                    {quiz.myAttempt ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {t('quizScore')}: {quiz.myAttempt.score}/{quiz.myAttempt.totalMarks} ({quiz.myAttempt.percentage}%)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {t('statusNotAttempted')}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Clean Info Badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {quiz.quizType === 'IN_BUILD'
                        ? 'LMS Quiz'
                        : quiz.quizType === 'GOOGLE_FORM'
                        ? 'Google Form'
                        : 'Dual Format'}
                    </span>
                    {quiz.timeLimitMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {quiz.timeLimitMinutes} {t('mins')}
                      </span>
                    )}
                    {quiz.questionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <FileQuestion className="w-3 h-3 text-slate-400" />
                        {quiz.questionCount} {t('quizQuestions')}
                      </span>
                    )}
                    {quiz.totalMarks > 0 && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-slate-400" />
                        {quiz.totalMarks} {t('quizMarks')}
                      </span>
                    )}
                  </div>

                  {/* Review Link if attempted */}
                  {quiz.myAttempt && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">{t('statusCompleted')}</span>
                      <button
                        onClick={() => handleOpenReview(quiz)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        {t('actionReviewAnswers')} &rarr;
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons: Dual buttons if Google Form is present, only 1 button if not */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex flex-col gap-2">
                  {/* Button 1: LMS In-Built Test */}
                  {hasLmsQuiz && (
                    <Link
                      to={`/student/quizzes/${quiz.id}/attempt`}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        quiz.myAttempt
                          ? 'bg-slate-700 hover:bg-slate-800 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {quiz.myAttempt ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('actionReattempt')}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{t('actionTakeQuiz')}</span>
                        </>
                      )}
                    </Link>
                  )}

                  {/* Button 2: Google Form Quiz (ONLY shown if teacher provided link) */}
                  {hasGoogleForm && (
                    <a
                      href={quiz.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 transition"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{t('actionOpenGoogleForm')}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Review Modal */}
      {reviewQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Review: {reviewQuiz.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Review your answers and correct options.
                </p>
              </div>
              <button
                onClick={() => setReviewQuiz(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingReview ? (
                <LoadingSpinner message="Loading answers..." />
              ) : reviewData ? (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Score:</span>{' '}
                      <strong className="text-slate-900 font-bold">
                        {reviewData.score} / {reviewData.totalMarks} ({reviewData.percentage}%)
                      </strong>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(reviewData.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {reviewData.answers.map((ans, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                          ans.isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-red-50/40 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            Q{idx + 1}. {ans.questionText}
                          </span>
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                              ans.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {ans.isCorrect ? `+${ans.marksAwarded}` : '0'}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-0.5">
                          <p>
                            <span className="text-slate-500">Your choice:</span>{' '}
                            <span className={ans.isCorrect ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
                              {ans.selectedOptionText || '(None)'}
                            </span>
                          </p>
                          {!ans.isCorrect && ans.correctOptionText && (
                            <p>
                              <span className="text-slate-500">Correct:</span>{' '}
                              <span className="text-emerald-700 font-semibold">
                                {ans.correctOptionText}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="No Review" description="Could not load your attempt." />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
