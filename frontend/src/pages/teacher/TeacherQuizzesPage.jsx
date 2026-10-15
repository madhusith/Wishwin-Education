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
  ExternalLink,
  Edit,
  Trash2,
  Users,
  Eye,
  EyeOff,
  X,
  FileQuestion,
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
    const updated = [...formData.questions];
    updated[qIndex].questionText = text;
    setFormData({ ...formData, questions: updated });
  };

  const handleQuestionMarksChange = (qIndex, marks) => {
    const updated = [...formData.questions];
    updated[qIndex].marks = Number(marks) || 1;
    setFormData({ ...formData, questions: updated });
  };

  const handleOptionTextChange = (qIndex, oIndex, text) => {
    const updated = [...formData.questions];
    updated[qIndex].options[oIndex].optionText = text;
    setFormData({ ...formData, questions: updated });
  };

  const handleSetCorrectOption = (qIndex, correctIndex) => {
    const updated = [...formData.questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === correctIndex,
    }));
    setFormData({ ...formData, questions: updated });
  };

  const handleAddOption = (qIndex) => {
    const updated = [...formData.questions];
    if (updated[qIndex].options.length >= 6) return;
    updated[qIndex].options.push({ optionText: '', isCorrect: false });
    setFormData({ ...formData, questions: updated });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updated = [...formData.questions];
    if (updated[qIndex].options.length <= 2) {
      alert('At least 2 options required.');
      return;
    }
    const wasCorrect = updated[qIndex].options[oIndex].isCorrect;
    updated[qIndex].options.splice(oIndex, 1);
    if (wasCorrect && updated[qIndex].options.length > 0) {
      updated[qIndex].options[0].isCorrect = true;
    }
    setFormData({ ...formData, questions: updated });
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
      alert('At least one question is required.');
      return;
    }
    const updated = [...formData.questions];
    updated.splice(qIndex, 1);
    setFormData({ ...formData, questions: updated });
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.title.trim()) {
      alert('Please fill in Class and Title.');
      return;
    }

    if (formData.quizType === 'GOOGLE_FORM' || formData.quizType === 'BOTH') {
      if (!formData.googleFormUrl.trim()) {
        alert('Please enter the Google Form URL.');
        return;
      }
    }

    if (formData.quizType === 'IN_BUILD' || formData.quizType === 'BOTH') {
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        if (!q.questionText.trim()) {
          alert(`Question #${i + 1} text cannot be empty.`);
          return;
        }
        const hasOptions = q.options.some((o) => o.optionText.trim() !== '');
        if (!hasOptions) {
          alert(`Question #${i + 1} needs option texts.`);
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
      console.error('Error toggling publish:', err);
      alert('Failed to update status.');
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
      alert('Failed to load submissions.');
    } finally {
      setLoadingSubmissions(false);
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
      {/* Page Header with PROMINENT Create Quiz Button in actions prop */}
      <PageHeader
        title="Online Quizzes & Assessments"
        subtitle="Create interactive in-built LMS tests or attach Google Forms for your students."
        breadcrumbs={[
          { label: 'Teacher', href: '/teacher/dashboard' },
          { label: 'Quizzes' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quiz</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Clean, Simple Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quizzes by title..."
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
            <option value="">All Assigned Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="sm:hidden inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner message="Loading quizzes..." />
      ) : filteredQuizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No Quizzes Yet"
          description={
            searchQuery || selectedClassId
              ? 'No quizzes match your filter criteria.'
              : 'You have not created any quizzes yet. Click "+ Create New Quiz" to add your first quiz.'
          }
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
            >
              + Create New Quiz
            </button>
          }
        />
      ) : (
        /* CLEAN, SIMPLE CARDS (No bulky frames) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div className="p-4">
                {/* Header row: Class name & Published toggle */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {quiz.className}
                  </span>
                  <button
                    onClick={() => handleTogglePublish(quiz)}
                    title={quiz.published ? 'Published - Click to Unpublish' : 'Draft - Click to Publish'}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                      quiz.published
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {quiz.published ? (
                      <>
                        <Eye className="w-3 h-3" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Draft
                      </>
                    )}
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {quiz.description}
                  </p>
                )}

                {/* Simple format indicator */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {quiz.quizType === 'IN_BUILD'
                      ? 'LMS In-Built Quiz'
                      : quiz.quizType === 'GOOGLE_FORM'
                      ? 'Google Form'
                      : 'Dual (LMS & Google Form)'}
                  </span>
                  {quiz.timeLimitMinutes > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {quiz.timeLimitMinutes}m
                    </span>
                  )}
                  {quiz.questionCount > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <FileQuestion className="w-3 h-3 text-slate-400" />
                      {quiz.questionCount} Qs
                    </span>
                  )}
                  {quiz.totalMarks > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Award className="w-3 h-3 text-slate-400" />
                      {quiz.totalMarks} Marks
                    </span>
                  )}
                </div>

                {/* Google Form Link if present */}
                {quiz.googleFormUrl && (
                  <div className="mt-2.5 text-xs flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      Google Form attached
                    </span>
                    <a
                      href={quiz.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1"
                    >
                      Open Link <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Card Footer: Submissions button & Actions */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between">
                <button
                  onClick={() => openSubmissionsModal(quiz)}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submissions ({quiz.attemptCount || 0})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(quiz)}
                    title="Edit Quiz"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-200/50 rounded transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmQuiz(quiz)}
                    title="Delete Quiz"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200/50 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SIMPLE, CLEAN CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                </h3>
                <p className="text-xs text-slate-500">
                  Choose your quiz type (In-Built LMS or Google Form).
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitQuiz} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Class & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quiz Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics Practice Test 01"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Description & Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20 minutes timed session"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* QUIZ FORMAT SELECTION - Clean, Simple Segmented Control */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quiz Format Option <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, quizType: 'IN_BUILD' })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition cursor-pointer ${
                      formData.quizType === 'IN_BUILD'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    1. LMS In-Built
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, quizType: 'GOOGLE_FORM' })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition cursor-pointer ${
                      formData.quizType === 'GOOGLE_FORM'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    2. Google Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, quizType: 'BOTH' })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition cursor-pointer ${
                      formData.quizType === 'BOTH'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    3. Both (In-Built & Form)
                  </button>
                </div>
              </div>

              {/* Google Form Link Input */}
              {(formData.quizType === 'GOOGLE_FORM' || formData.quizType === 'BOTH') && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Google Form Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                    value={formData.googleFormUrl}
                    onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                    required={formData.quizType === 'GOOGLE_FORM'}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-500">
                    Students will see an "Open Google Form Quiz" button. If not provided, the button will not be shown to students.
                  </p>
                </div>
              )}

              {/* In-Built Questions Editor */}
              {(formData.quizType === 'IN_BUILD' || formData.quizType === 'BOTH') && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">
                        In-Built MCQ Questions ({formData.questions.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Select the radio button for the correct answer.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <label className="text-[11px]">Timer:</label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={formData.timeLimitMinutes}
                          onChange={(e) =>
                            setFormData({ ...formData, timeLimitMinutes: e.target.value })
                          }
                          className="w-14 px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-center"
                        />
                        <span className="text-[11px] text-slate-400">mins (0=untimed)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                      >
                        + Add Question
                      </button>
                    </div>
                  </div>

                  {/* Question items */}
                  <div className="space-y-3">
                    {formData.questions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-3 rounded-lg border border-slate-200 bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            Q{qIndex + 1}.
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-slate-500">Marks:</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={q.marks}
                              onChange={(e) => handleQuestionMarksChange(qIndex, e.target.value)}
                              className="w-12 px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded text-center"
                            />
                            {formData.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIndex)}
                                className="text-red-500 hover:text-red-700 text-xs p-1"
                                title="Remove question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Type question text..."
                          value={q.questionText}
                          onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        />

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oIndex) => (
                            <div
                              key={oIndex}
                              className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs ${
                                opt.isCorrect
                                  ? 'border-emerald-400 bg-emerald-50/50'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={opt.isCorrect}
                                onChange={() => handleSetCorrectOption(qIndex, oIndex)}
                                className="w-3.5 h-3.5 text-emerald-600 focus:ring-0"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                value={opt.optionText}
                                onChange={(e) =>
                                  handleOptionTextChange(qIndex, oIndex, e.target.value)
                                }
                                className="flex-1 text-xs bg-transparent border-0 focus:outline-none"
                              />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(qIndex, oIndex)}
                                  className="text-slate-400 hover:text-red-500 px-1"
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
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publish Checkbox */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <label className="text-slate-700 font-semibold cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Publish this quiz now</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingQuiz ? 'Save Changes' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {submissionsModalQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Submissions: {submissionsModalQuiz.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total student attempts: {submissions.length}
                </p>
              </div>
              <button
                onClick={() => setSubmissionsModalQuiz(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {loadingSubmissions ? (
                <LoadingSpinner message="Loading attempts..." />
              ) : submissions.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Attempts"
                  description="No students have attempted this quiz yet."
                />
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-2">Student</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2 text-center">Score</th>
                      <th className="pb-2 text-center">Result</th>
                      <th className="pb-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-semibold text-slate-900">{sub.studentName}</td>
                        <td className="py-2.5 text-slate-500">{sub.studentEmail}</td>
                        <td className="py-2.5 text-center font-bold text-blue-600">
                          {sub.score} / {sub.totalMarks}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {sub.percentage}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-400">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmQuiz)}
        title="Delete Quiz"
        message={`Delete "${deleteConfirmQuiz?.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDeleteQuiz}
        onCancel={() => setDeleteConfirmQuiz(null)}
      />
    </DashboardLayout>
  );
}
