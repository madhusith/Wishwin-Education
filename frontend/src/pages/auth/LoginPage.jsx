import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleDashboardPath } from '../../utils/navigation';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(email, password);
      // Navigate to requested location or role dashboard
      const targetPath = from || getRoleDashboardPath(user.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F4D] via-[#112d70] to-[#1E3A8A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-white shadow-xl mb-4 backdrop-blur-sm">
          <GraduationCap className="w-9 h-9 text-sky-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Wishwin LMS</h2>
        <p className="mt-2 text-sm text-sky-200">
          Education Center Learning Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Sign In to Your Account</h3>
            <p className="text-xs text-slate-500 mt-1">Access classes, materials, quizzes, and live sessions</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-700 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@wishwin.edu"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition duration-150"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-600">
              New student or parent?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                Create an account
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Quick Test Logins (Demo Seeds)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@wishwin.edu', 'Admin@12345')}
                className="px-2 py-1.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-left transition font-medium border border-slate-200"
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('teacher@wishwin.edu', 'Password@12345')}
                className="px-2 py-1.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-left transition font-medium border border-slate-200"
              >
                👨‍🏫 Teacher
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('student@wishwin.edu', 'Password@12345')}
                className="px-2 py-1.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-left transition font-medium border border-slate-200"
              >
                🎒 Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('parent@wishwin.edu', 'Password@12345')}
                className="px-2 py-1.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-left transition font-medium border border-slate-200"
              >
                👨‍👩‍👧 Parent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
