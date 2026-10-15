import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';
import {
  HelpCircle,
  Plus,
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  ExternalLink,
  Edit,
  Trash2,
  Users,
  Eye,
  EyeOff,
  X,
  FileQuestion,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Award,
} from 'lucide-react';

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [saving, setSaving] = useState(false);

  // Submissions Modal State
  const [submissionsModalQuiz, setSubmissionsModalQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Delete Dialog
  const [deleteConfirmQuiz, setDeleteConfirmQuiz] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const initialFormState = {
    classId: '',
    title: '',
    description: '',
    instructions: '',
    quizType: 'IN_BUILD', // 'IN_BUILD' | 'GOOGLE_FORM' | 'BOTH'
    googleFormUrl: '',
    timeLimitMinutes: 0,
    published: true,
    questions: [
      {
        questionText: '',
        marks: 1,
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
      },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);

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
      console.error('Error fetching quiz data:', err);
      setError(err.response?.data?.message || 'Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingQuiz(null);
    setFormData({
      ...initialFormState,
      classId: classes.length > 0 ? classes[0].id : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (quiz) => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${quiz.id}`);
      const fullQuiz = res.data?.data;
      setEditingQuiz(fullQuiz);

      // Format questions for form
      const formattedQuestions = (fullQuiz.questions || []).map((q) => ({
        questionText: q.questionText || '',
        marks: q.marks || 1,
        options: (q.options || []).map((o) => ({
          optionText: o.optionText || '',
          isCorrect: Boolean(o.isCorrect),
        })),
      }));

      setFormData({
        classId: fullQuiz.classId,
        title: fullQuiz.title,
        description: fullQuiz.description || '',
        instructions: fullQuiz.instructions || '',
        quizType: fullQuiz.quizType || 'IN_BUILD',
        googleFormUrl: fullQuiz.googleFormUrl || '',
        timeLimitMinutes: fullQuiz.timeLimitMinutes || 0,
        published: fullQuiz.published,
        questions: formattedQuestions.length > 0 ? formattedQuestions : initialFormState.questions,
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching quiz details for edit:', err);
      alert('Failed to load quiz details for editing.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionTextChange = (qIndex, text) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].questionText = text;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleQuestionMarksChange = (qIndex, marks) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].marks = Number(marks) || 1;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleOptionTextChange = (qIndex, oIndex, text) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].options[oIndex].optionText = text;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleSetCorrectOption = (qIndex, correctIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === correctIndex,
    }));
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[qIndex].options.length >= 6) return;
    updatedQuestions[qIndex].options.push({
      optionText: '',
      isCorrect: false,
    });
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[qIndex].options.length <= 2) {
      alert('Questions must have at least 2 options.');
      return;
    }
    const wasCorrect = updatedQuestions[qIndex].options[oIndex].isCorrect;
    updatedQuestions[qIndex].options.splice(oIndex, 1);
    if (wasCorrect && updatedQuestions[qIndex].options.length > 0) {
      updatedQuestions[qIndex].options[0].isCorrect = true;
    }
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: '',
          marks: 1,
          options: [
            { optionText: '', isCorrect: true },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
          ],
        },
      ],
    });
  };

  const handleRemoveQuestion = (qIndex) => {
    if (formData.questions.length <= 1) {
      alert('You must have at least one question in an in-built quiz.');
      return;
    }
    const updated = [...formData.questions];
    updated.splice(qIndex, 1);
    setFormData({ ...formData, questions: updated });
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.title.trim()) {
      alert('Please fill in Class and Quiz Title.');
      return;
    }

    // Validation based on quizType
    if (formData.quizType === 'GOOGLE_FORM' || formData.quizType === 'BOTH') {
      if (!formData.googleFormUrl.trim()) {
        alert('Please enter a valid Google Form URL.');
        return;
      }
    }

    if (formData.quizType === 'IN_BUILD' || formData.quizType === 'BOTH') {
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        if (!q.questionText.trim()) {
          alert(`Question #${i + 1} text is required.`);
          return;
        }
        const hasOptions = q.options.some((o) => o.optionText.trim() !== '');
        if (!hasOptions) {
          alert(`Question #${i + 1} must have answer options.`);
          return;
        }
        const hasCorrect = q.options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          alert(`Question #${i + 1} must have one option marked as correct answer.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz.id}`, formData);
      } else {
        await api.post('/quizzes', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert(err.response?.data?.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (quiz) => {
    try {
      const res = await api.patch(`/quizzes/${quiz.id}/publish`);
      const newStatus = res.data?.published;
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, published: newStatus } : q))
      );
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Failed to update publication status.');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteConfirmQuiz) return;
    setDeleting(true);
    try {
      await api.delete(`/quizzes/${deleteConfirmQuiz.id}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteConfirmQuiz.id));
      setDeleteConfirmQuiz(null);
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert('Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  const openSubmissionsModal = async (quiz) => {
    setSubmissionsModalQuiz(quiz);
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/quizzes/${quiz.id}/attempts`);
      setSubmissions(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      alert('Failed to load submissions for this quiz.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Filtered Quizzes
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
        subtitle="Create timed interactive MCQ tests or attach Google Forms to evaluate student learning."
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 uppercase tracking-wider border border-purple-200">
            Assessment Hub
          </span>
        }
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm hover:shadow transition"
          >
            <Plus className="w-4 h-4" />
            Create New Quiz
          </button>
        }
      />

      {/* Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quizzes</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{quizzes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Published</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {quizzes.filter((q) => q.published).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">LMS In-Built</p>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {quizzes.filter((q) => q.quizType === 'IN_BUILD' || q.quizType === 'BOTH').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Google Forms</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {quizzes.filter((q) => q.quizType === 'GOOGLE_FORM' || (q.googleFormUrl && q.googleFormUrl.trim() !== '')).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quizzes by title..."
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
            <option value="">All Assigned Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner message="Loading your quizzes..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : filteredQuizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No Quizzes Found"
          description={
            searchQuery || selectedClassId
              ? 'No quizzes matched your filter criteria.'
              : 'You have not created any quizzes yet. Click "Create New Quiz" to get started.'
          }
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
            >
              Create First Quiz
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                {/* Header row: Class badge & publication status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {quiz.className}
                  </span>
                  <button
                    onClick={() => handleTogglePublish(quiz)}
                    title={quiz.published ? 'Click to Unpublish' : 'Click to Publish'}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition ${
                      quiz.published
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {quiz.published ? (
                      <>
                        <Eye className="w-3 h-3 text-emerald-600" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-400" /> Draft
                      </>
                    )}
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
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
                      <Layers className="w-3 h-3 text-purple-600" /> Dual Format (LMS + Google Form)
                    </span>
                  )}

                  {quiz.timeLimitMinutes > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                      <Clock className="w-3 h-3" /> {quiz.timeLimitMinutes} mins
                    </span>
                  )}
                </div>

                {/* Stats Info */}
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

                {/* Google Form Link Indicator if available */}
                {quiz.googleFormUrl && (
                  <div className="mt-3 p-2 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-amber-800 font-medium truncate max-w-[200px]">
                      Google Form Attached
                    </span>
                    <a
                      href={quiz.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 text-xs font-semibold flex items-center gap-1"
                    >
                      Visit <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Card Footer: Submissions button & Edit/Delete */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openSubmissionsModal(quiz)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Submissions ({quiz.attemptCount || 0})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(quiz)}
                    title="Edit Quiz"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmQuiz(quiz)}
                    title="Delete Quiz"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingQuiz ? 'Edit Quiz & Assessment' : 'Create New Quiz'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure interactive MCQ test or connect a Google Form link.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitQuiz} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quiz Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scholarship Mathematics Speed Test 01"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Instructions and Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the quiz topics covered..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Instructions for Students
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Choose the best answer. No calculator permitted."
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* QUIZ FORMAT SELECTION (Crucial User Requirement) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quiz Format Option <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: LMS In-Built */}
                  <div
                    onClick={() => setFormData({ ...formData, quizType: 'IN_BUILD' })}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      formData.quizType === 'IN_BUILD'
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">1. LMS In-Built Quiz</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Create MCQ questions directly on Wishwin LMS with automated marking.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 mt-3">
                      {formData.quizType === 'IN_BUILD' ? '✓ Selected' : 'Select'}
                    </span>
                  </div>

                  {/* Option 2: Google Form */}
                  <div
                    onClick={() => setFormData({ ...formData, quizType: 'GOOGLE_FORM' })}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      formData.quizType === 'GOOGLE_FORM'
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">2. Google Form Quiz</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Paste your external Google Form link. Students open and fill it directly.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 mt-3">
                      {formData.quizType === 'GOOGLE_FORM' ? '✓ Selected' : 'Select'}
                    </span>
                  </div>

                  {/* Option 3: Dual Mode (Both) */}
                  <div
                    onClick={() => setFormData({ ...formData, quizType: 'BOTH' })}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      formData.quizType === 'BOTH'
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">3. Dual Format (Both)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Provide both LMS in-built questions AND Google Form button for students.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-purple-600 mt-3">
                      {formData.quizType === 'BOTH' ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GOOGLE FORM URL INPUT (Visible when GOOGLE_FORM or BOTH is selected) */}
              {(formData.quizType === 'GOOGLE_FORM' || formData.quizType === 'BOTH') && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Google Form Link <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                      value={formData.googleFormUrl}
                      onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                      required={formData.quizType === 'GOOGLE_FORM'}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-amber-700">
                    📌 <strong>Note:</strong> Students will see an "Open Google Form Quiz" button. If left empty, the button is hidden from students.
                  </p>
                </div>
              )}

              {/* LMS IN-BUILD QUESTIONS BUILDER (Visible when IN_BUILD or BOTH is selected) */}
              {(formData.quizType === 'IN_BUILD' || formData.quizType === 'BOTH') && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        In-Built LMS Questions ({formData.questions.length})
                      </h4>
                      <p className="text-xs text-slate-500">
                        Add multiple choice questions and mark the single correct answer.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <label>Timer:</label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={formData.timeLimitMinutes}
                          onChange={(e) =>
                            setFormData({ ...formData, timeLimitMinutes: e.target.value })
                          }
                          className="w-16 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center"
                        />
                        <span className="text-slate-400">mins (0=untimed)</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Question
                      </button>
                    </div>
                  </div>

                  {/* Question Cards */}
                  <div className="space-y-4">
                    {formData.questions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md">
                            Question #{qIndex + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 font-medium">Marks:</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={q.marks}
                              onChange={(e) => handleQuestionMarksChange(qIndex, e.target.value)}
                              className="w-14 px-2 py-0.5 text-xs bg-white border border-slate-200 rounded-md text-center"
                            />
                            {formData.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIndex)}
                                className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Remove question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Type question here (e.g. What is the value of 35 x 4?)..."
                          value={q.questionText}
                          onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                        />

                        {/* Options List */}
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Answer Options (Select the radio of the correct answer):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIndex) => (
                              <div
                                key={oIndex}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-opt-${qIndex}`}
                                  checked={opt.isCorrect}
                                  onChange={() => handleSetCorrectOption(qIndex, oIndex)}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                />
                                <input
                                  type="text"
                                  placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                  value={opt.optionText}
                                  onChange={(e) =>
                                    handleOptionTextChange(qIndex, oIndex, e.target.value)
                                  }
                                  className="flex-1 px-2.5 py-1 text-xs bg-transparent border-0 focus:outline-none focus:ring-0"
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(qIndex, oIndex)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                    title="Remove option"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {q.options.length < 6 && (
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIndex)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mt-1"
                            >
                              <Plus className="w-3 h-3" /> Add another option
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Published Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Publish Immediately</h4>
                  <p className="text-[11px] text-slate-500">
                    If active, enrolled students can see and attempt this quiz right away.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition"
                >
                  {saving ? 'Saving Quiz...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {submissionsModalQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Student Submissions: {submissionsModalQuiz.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total Attempts: {submissions.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubmissionsModalQuiz(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingSubmissions ? (
                <LoadingSpinner message="Loading attempts..." />
              ) : submissions.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Submissions Yet"
                  description="No students have attempted this quiz so far."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Student</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3 text-center">Score</th>
                        <th className="pb-3 text-center">Percentage</th>
                        <th className="pb-3 pr-2 text-right">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 pl-2 font-bold text-slate-900">{sub.studentName}</td>
                          <td className="py-3 text-slate-500">{sub.studentEmail}</td>
                          <td className="py-3 text-center font-bold text-blue-600">
                            {sub.score} / {sub.totalMarks}
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                sub.percentage >= 75
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : sub.percentage >= 50
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {sub.percentage}%
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right text-slate-400">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmQuiz)}
        title="Delete Quiz"
        message={`Are you sure you want to delete "${deleteConfirmQuiz?.title}"? All student attempts, questions, and records associated with it will be permanently deleted.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDeleteQuiz}
        onCancel={() => setDeleteConfirmQuiz(null)}
      />
    </DashboardLayout>
  );
}
