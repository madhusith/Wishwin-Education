import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Award,
  Check,
  X as XIcon,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

export default function StudentQuizAttemptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Exam State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: optionId }
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  // Result State (Once submitted)
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/quizzes/${id}`);
      const data = res.data?.data;
      setQuiz(data);

      // Setup timer if timeLimitMinutes > 0
      if (data.timeLimitMinutes > 0) {
        setSecondsRemaining(data.timeLimitMinutes * 60);
      }
    } catch (err) {
      console.error('Error fetching quiz to attempt:', err);
      setError(err.response?.data?.message || 'Failed to load quiz details.');
    } finally {
      setLoading(false);
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0 || result) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, result]);

  const handleAutoSubmit = () => {
    alert('Time has expired! Submitting your quiz now.');
    submitAnswers();
  };

  const handleSelectOption = (questionId, optionId) => {
    if (result) return; // Do not modify if already completed
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleClearAnswer = (questionId) => {
    if (result) return;
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, optId]) => ({
        questionId: Number(qId),
        selectedOptionId: Number(optId),
      }));

      const res = await api.post(`/quizzes/${id}/submit`, {
        answers: answersPayload,
      });

      setResult(res.data?.data);
      setShowSubmitConfirm(false);
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      alert(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoadingSpinner message="Preparing your quiz session..." />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message={error || 'Quiz not found'} onRetry={fetchQuiz} />
          <div className="mt-4 text-center">
            <Link
              to="/student/quizzes"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              &larr; Return to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/student/quizzes"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Exit Quiz"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800">
                  {quiz.className}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • {quiz.gradeName}
                </span>
              </div>
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight mt-0.5">
                {quiz.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Countdown Timer if present */}
            {secondsRemaining !== null && !result && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  secondsRemaining <= 120
                    ? 'bg-red-50 text-red-600 animate-pulse border border-red-200'
                    : secondsRemaining <= 300
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}

            {!result && (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                {t('actionSubmitQuiz')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Examination View */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col">
        {result ? (
          /* RESULT VIEW */
          <div className="max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
            {/* Scorecard Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Award className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Quiz Evaluation Completed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                {result.percentage >= 75
                  ? 'Outstanding Performance! 🌟'
                  : result.percentage >= 50
                  ? 'Great Job! Keep Practicing 👍'
                  : 'Practice Makes Perfect! 💪'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your answers have been marked instantly by the automated grading system.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6 pt-6 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Score</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{result.score}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Marks</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{result.totalMarks}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Percentage</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{result.percentage}%</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  to="/student/quizzes"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition"
                >
                  Back to All Quizzes
                </Link>
                <button
                  onClick={() => {
                    setResult(null);
                    setSelectedAnswers({});
                    setCurrentQuestionIndex(0);
                    if (quiz.timeLimitMinutes > 0) {
                      setSecondsRemaining(quiz.timeLimitMinutes * 60);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>

            {/* Answer Breakdown */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Question-by-Question Breakdown</h3>
              {questions.map((q, idx) => {
                const evalAns = (result.answers || []).find((a) => a.questionId === q.id);
                const isCorrect = evalAns?.isCorrect;
                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl p-5 border shadow-2xs ${
                      isCorrect ? 'border-emerald-300' : 'border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">Question #{idx + 1}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <Check className="w-3 h-3" /> Correct (+{q.marks || 1} Marks)
                          </>
                        ) : (
                          <>
                            <XIcon className="w-3 h-3" /> Incorrect (0 Marks)
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 mb-3">{q.questionText}</p>

                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isStudentChoice = evalAns?.selectedOptionId === opt.id;
                        const isTheCorrectOne = evalAns?.correctOptionId === opt.id;

                        let optStyle = 'border-slate-200 bg-slate-50 text-slate-700';
                        if (isTheCorrectOne) {
                          optStyle =
                            'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                        } else if (isStudentChoice && !isCorrect) {
                          optStyle = 'border-red-400 bg-red-50 text-red-900 font-semibold';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}
                          >
                            <span>{opt.optionText}</span>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              {isStudentChoice && (
                                <span className="font-bold text-slate-600 bg-white/70 px-2 py-0.5 rounded">
                                  Your Choice
                                </span>
                              )}
                              {isTheCorrectOne && (
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* QUESTION ATTEMPT VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-start">
            {/* Left/Main Column: Question Card */}
            <div className="lg:col-span-3 space-y-4">
              {currentQuestion ? (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {currentQuestion.marks || 1} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQuestion.questionText}
                  </h2>

                  {/* Options List */}
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((opt, optIndex) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className="text-sm font-medium text-slate-900">
                              {opt.optionText}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Bar (Prev / Clear / Next) */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                      }
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
                    >
                      <ArrowLeft className="w-4 h-4" /> {t('quizPrevious')}
                    </button>

                    {selectedAnswers[currentQuestion.id] && (
                      <button
                        onClick={() => handleClearAnswer(currentQuestion.id)}
                        className="text-xs text-slate-400 hover:text-red-500 font-semibold transition"
                      >
                        {t('quizClearChoice')}
                      </button>
                    )}

                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <button
                        onClick={() =>
                          setCurrentQuestionIndex((prev) =>
                            Math.min(totalQuestions - 1, prev + 1)
                          )
                        }
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        {t('quizNext')} <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        <Send className="w-3.5 h-3.5" /> {t('actionSubmitQuiz')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center text-slate-500">
                  No questions found in this quiz.
                </div>
              )}
            </div>

            {/* Right Column: Question Navigator */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {t('quizPalette')}
                </h3>
                <span className="text-xs font-bold text-blue-700">
                  {answeredCount} / {totalQuestions} {t('quizAnswered')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '0%',
                  }}
                />
              </div>

              {/* Number Chips */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;

                  let chipStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                  if (isCurrent) {
                    chipStyle = 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2';
                  } else if (isAnswered) {
                    chipStyle = 'bg-emerald-100 text-emerald-800 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${chipStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300 inline-block" />
                  <span>{t('quizAnswered')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300 inline-block" />
                  <span>{t('quizUnanswered')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-blue-600 inline-block" />
                  <span>{t('quizCurrentQuestion')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSubmitConfirm}
        title="Submit Your Quiz Answers?"
        message={`You have answered ${answeredCount} of ${totalQuestions} questions. Are you ready to finish and view your instant score?`}
        confirmText="Yes, Submit Answers"
        cancelText="Keep Answering"
        confirmVariant="primary"
        loading={submitting}
        onConfirm={submitAnswers}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
}
