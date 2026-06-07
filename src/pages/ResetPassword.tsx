import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    const { error: err } = await updatePassword(password, token);
    setIsLoading(false);
    if (err) {
      setError(err);
    } else {
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">
        {!isSuccess ? (
          <>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">New password.</h1>
              <p className="text-gray-500 text-sm font-medium">Set a new secure password for your account.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {!token ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-4">This reset link is invalid or has expired.</p>
                <Link to="/forgot-password" className="text-brand-blue font-bold text-sm hover:underline">
                  Request a new reset link →
                </Link>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="password">New Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all outline-none placeholder-gray-400"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="confirm">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all outline-none placeholder-gray-400"
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || password.length < 8}
                  className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 disabled:cursor-not-allowed font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none h-[52px]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Password updated!</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">Redirecting you to login in 3 seconds...</p>
            <Link to="/login" className="text-brand-blue font-bold text-sm hover:underline">Go to login →</Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
