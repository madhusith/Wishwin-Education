import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Mail,
  Phone,
  UserCheck,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Password Reveal Map: { [userId]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedFieldId, setCopiedFieldId] = useState(null);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'TEACHER',
    status: 'ACTIVE',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Quick Reset Password Modal State
  const [resetModal, setResetModal] = useState({
    isOpen: false,
    user: null,
    newPassword: '',
    submitting: false,
    error: null,
    success: null,
  });

  // Confirm Status Toggle Dialog
  const [statusDialog, setStatusDialog] = useState({
    isOpen: false,
    user: null,
    loading: false,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/users', { params });
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to retrieve users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const togglePasswordVisibility = (userId) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldId(fieldId);
    setTimeout(() => {
      setCopiedFieldId(null);
    }, 1800);
  };

  const copyFullCredentials = (u) => {
    const text = `Wishwin LMS Login Credentials\nName: ${u.firstName} ${u.lastName}\nUsername / Email: ${u.email}\nPassword: ${u.rawPassword || 'Wishwin@123'}\nLogin URL: ${window.location.origin}/login`;
    copyToClipboard(text, `full-${u.id}`);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'TEACHER',
      status: 'ACTIVE',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      status: u.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openResetModal = (u) => {
    setResetModal({
      isOpen: true,
      user: u,
      newPassword: '',
      submitting: false,
      error: null,
      success: null,
    });
  };

  const handleGenerateRandomPassword = () => {
    const randomPins = ['Wishwin@2026', 'Student@2026', 'Pass@1234', 'Edu@2026', 'Win@2026'];
    const randomChoice = randomPins[Math.floor(Math.random() * randomPins.length)];
    setResetModal((prev) => ({ ...prev, newPassword: randomChoice }));
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetModal.user || !resetModal.newPassword.trim()) return;

    try {
      setResetModal((prev) => ({ ...prev, submitting: true, error: null, success: null }));
      const res = await api.put(`/admin/users/${resetModal.user.id}/reset-password`, {
        password: resetModal.newPassword.trim(),
      });

      if (res.data?.success) {
        setResetModal((prev) => ({
          ...prev,
          submitting: false,
          success: 'Password updated successfully! Copied to clipboard.',
        }));

        // Copy credentials to clipboard
        const text = `Wishwin LMS Login Credentials\nName: ${resetModal.user.firstName} ${resetModal.user.lastName}\nUsername / Email: ${resetModal.user.email}\nPassword: ${resetModal.newPassword.trim()}\nLogin URL: ${window.location.origin}/login`;
        navigator.clipboard.writeText(text);

        // Update local user record
        setUsers((prev) =>
          prev.map((u) =>
            u.id === resetModal.user.id ? { ...u, rawPassword: resetModal.newPassword.trim() } : u
          )
        );

        setTimeout(() => {
          setResetModal({
            isOpen: false,
            user: null,
            newPassword: '',
            submitting: false,
            error: null,
            success: null,
          });
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      setResetModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.message || 'Failed to reset password.',
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Form submission failed:', err);
      setFormError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const triggerStatusToggle = (u) => {
    setStatusDialog({
      isOpen: true,
      user: u,
      loading: false,
    });
  };

  const confirmStatusToggle = async () => {
    if (!statusDialog.user) return;
    try {
      setStatusDialog((prev) => ({ ...prev, loading: true }));
      const newStatus = statusDialog.user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/admin/users/${statusDialog.user.id}/status`, { status: newStatus });
      setStatusDialog({ isOpen: false, user: null, loading: false });
      fetchUsers();
    } catch (err) {
      console.error('Status change failed:', err);
      alert(err.response?.data?.message || 'Failed to update user status.');
      setStatusDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const roleBadge = (role) => {
    const map = {
      ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      TEACHER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      STUDENT: 'bg-blue-100 text-blue-700 border-blue-200',
      PARENT: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${map[role] || map.STUDENT}`}>
        {role}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="User Management"
        subtitle="Manage accounts, view student & parent login credentials, and reset forgotten passwords."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Users' },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchUsers} className="mb-4" />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="PARENT">Parents</option>
            <option value="TEACHER">Teachers</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Loading user accounts..." />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Users}
              title="No users found"
              description="No matching user accounts found for the selected filters."
              action={
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Create User Account
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Login Username</th>
                  <th className="py-3.5 px-4">Password</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => {
                  const isPasswordRevealed = Boolean(revealedPasswords[u.id]);
                  const isEmailCopied = copiedFieldId === `email-${u.id}`;
                  const isPassCopied = copiedFieldId === `pass-${u.id}`;
                  const isFullCopied = copiedFieldId === `full-${u.id}`;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      {/* User Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {u.phone || 'No phone'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">{roleBadge(u.role)}</td>

                      {/* Username / Login Email */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                          <span className="font-mono text-xs font-semibold text-slate-800 max-w-[170px] truncate select-all">
                            {u.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.email, `email-${u.id}`)}
                            title="Copy Username"
                            className="text-slate-400 hover:text-blue-600 transition p-0.5"
                          >
                            {isEmailCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Password with Reveal & Copy */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isPasswordRevealed ? 'text-blue-700 select-all' : 'text-slate-400 tracking-widest'
                            }`}
                          >
                            {isPasswordRevealed ? (u.rawPassword || 'Wishwin@123') : '••••••••'}
                          </span>

                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            title={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                            className="text-slate-400 hover:text-slate-700 transition p-0.5 cursor-pointer ml-1"
                          >
                            {isPasswordRevealed ? (
                              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.rawPassword || 'Wishwin@123', `pass-${u.id}`)}
                            title="Copy Password"
                            className="text-slate-400 hover:text-blue-600 transition p-0.5 cursor-pointer"
                          >
                            {isPassCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Full Credentials for WhatsApp/SMS */}
                          <button
                            type="button"
                            onClick={() => copyFullCredentials(u)}
                            title="Copy login credentials to send to student/parent"
                            className="px-2 py-1 rounded-lg text-[11px] font-bold border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
                          >
                            {isFullCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy Login</span>
                              </>
                            )}
                          </button>

                          {/* Quick Reset Password Key */}
                          <button
                            type="button"
                            onClick={() => openResetModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Reset password for user"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit user details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Status Toggle */}
                          <button
                            type="button"
                            onClick={() => triggerStatusToggle(u)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK RESET PASSWORD MODAL */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !resetModal.submitting && setResetModal((prev) => ({ ...prev, isOpen: false }))}
          />

          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reset Password for {resetModal.user?.firstName} {resetModal.user?.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={resetModal.submitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetModal.error && (
              <div className="mt-3">
                <ErrorMessage message={resetModal.error} />
              </div>
            )}

            {resetModal.success && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetModal.success}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Username / Login ID:</span>
                  <strong className="text-slate-800 font-mono">{resetModal.user?.email}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Current Password:</span>
                  <strong className="text-blue-700 font-mono">
                    {resetModal.user?.rawPassword || 'Wishwin@123'}
                  </strong>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Set New Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Quick Suggest</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={resetModal.newPassword}
                  onChange={(e) => setResetModal((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="e.g. Wishwin@2026 or 123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Once saved, the updated credentials will be automatically copied to your clipboard so you can send them to the parent or student.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={resetModal.submitting}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetModal.submitting || !resetModal.newPassword.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {resetModal.submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Key className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Copy Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit User Details' : 'Create New User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={formSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Login Username) *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0771122334"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="PARENT">PARENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Password (Leave blank to keep unchanged)' : 'Initial Password *'}
                </label>
                <input
                  type="text"
                  required={!editingUser}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Min. 6 characters'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deactivate / Activate Dialog */}
      <ConfirmDialog
        isOpen={statusDialog.isOpen}
        title={`${statusDialog.user?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Account?`}
        message={`Are you sure you want to change status for ${statusDialog.user?.firstName} ${statusDialog.user?.lastName} to ${
          statusDialog.user?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        }?`}
        confirmText={statusDialog.user?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        confirmVariant={statusDialog.user?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={statusDialog.loading}
        onConfirm={confirmStatusToggle}
        onCancel={() => setStatusDialog({ isOpen: false, user: null, loading: false })}
      />
    </DashboardLayout>
  );
}
