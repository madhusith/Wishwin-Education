import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Eye,
  Download,
  Search,
  BookOpen,
  Calendar,
  X,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Upload Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    topic: '',
    description: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // In-LMS PDF Viewer Modal
  const [previewMaterial, setPreviewMaterial] = useState(null);

  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (classFilter) params.classId = classFilter;

      const [matRes, classRes] = await Promise.all([
        api.get('/materials', { params }),
        api.get('/classes'),
      ]);

      if (matRes.data?.data) setMaterials(matRes.data.data);
      if (classRes.data?.data) setClasses(classRes.data.data);
    } catch (err) {
      console.error('Failed to load learning materials:', err);
      setError(err.response?.data?.message || 'Failed to load learning materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, classFilter]);

  const openUploadModal = () => {
    setSelectedFile(null);
    setFormData({
      classId: classes[0]?.id || '',
      title: '',
      topic: '',
      description: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Invalid file type. Please upload a PDF document (.pdf).');
      setSelectedFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setFormError('File exceeds 20 MB size limit.');
      setSelectedFile(null);
      return;
    }

    setFormError(null);
    setSelectedFile(file);
    if (!formData.title) {
      // Auto-populate title without extension
      setFormData((prev) => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFormError('Please select a PDF file to upload.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('classId', formData.classId);
      data.append('title', formData.title.trim());
      if (formData.topic) data.append('topic', formData.topic.trim());
      if (formData.description) data.append('description', formData.description.trim());

      await api.post('/materials', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to upload material:', err);
      setFormError(err.response?.data?.message || 'Failed to upload PDF material.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const triggerDelete = (item) => {
    setDeleteDialog({
      isOpen: true,
      item,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await api.delete(`/materials/${deleteDialog.item.id}`);
      setDeleteDialog({ isOpen: false, item: null, loading: false });
      fetchData();
    } catch (err) {
      console.error('Failed to delete material:', err);
      alert(err.response?.data?.message || 'Failed to delete material.');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="PDF Tutes & Learning Materials"
        subtitle="Upload scholarship tutorials, worksheets, past papers, and study guides for your classes."
        breadcrumbs={[
          { label: 'Teacher', href: '/teacher/dashboard' },
          { label: 'Learning Materials' },
        ]}
        actions={
          <button
            onClick={openUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF Material</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} className="mb-4" />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search materials by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.gradeName}] {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200/80">
          <LoadingSpinner message="Loading learning materials..." />
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No materials uploaded yet"
          description="Upload PDF tutorials and worksheets for your students to download and study."
          action={
            <button
              onClick={openUploadModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Upload First PDF
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between p-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.fileSizeFormatted}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.gradeName} &bull; {item.className}
                    </span>
                    {item.topic && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {item.topic}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Uploaded: {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>PDF Document</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMaterial(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                    title="View PDF"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>

                <button
                  onClick={() => triggerDelete(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Delete material"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload PDF Modal (Step I2 & I3) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Upload PDF Learning Material
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                disabled={formSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4">
                <ErrorMessage message={formError} />
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Class *
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.gradeName}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PDF File Picker Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PDF Document File (Max 20 MB) *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-center">
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <FileCheck className="w-10 h-10 text-emerald-600 mb-2" />
                        <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to upload
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                        <div className="flex text-xs text-slate-600 justify-center">
                          <span className="font-bold text-blue-600 hover:text-blue-500">
                            Click to upload PDF
                          </span>
                          <span className="pl-1">or drag and drop</span>
                        </div>
                        <p className="text-[10px] text-slate-400">PDF documents only up to 20MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scholarship Model Paper 2026 - Question Sheet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Syllabus Topic / Subject Module
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Sinhala Grammar, Logic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students before attempting this tutorial..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || !selectedFile}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Upload PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-LMS PDF Viewer Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewMaterial(null)}
          />

          <div className="relative bg-white rounded-3xl max-w-4xl w-full h-[85vh] p-6 shadow-2xl border border-slate-100 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {previewMaterial.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewMaterial.gradeName} &bull; {previewMaterial.className} &bull; {previewMaterial.fileSizeFormatted}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewMaterial.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                src={previewMaterial.fileUrl}
                title={previewMaterial.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Learning Material?"
        message={`Are you sure you want to delete "${deleteDialog.item?.title}"? Students will no longer have access to this tutorial.`}
        confirmText="Delete Material"
        confirmVariant="danger"
        loading={deleteDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null, loading: false })}
      />
    </DashboardLayout>
  );
}
