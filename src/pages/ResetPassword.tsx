import React, { useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await updatePassword(password);
    setIsLoading(false);
    setIsSuccess(true);
    setTimeout(() => navigate('/login'), 2000);
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
              <button
                type="submit"
                disabled={isLoading || password.length < 8}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 disabled:cursor-not-allowed font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none h-[52px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Password updated!</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">Redirecting you to login...</p>
            <Link to="/login" className="text-brand-blue font-bold text-sm hover:underline">Go to login →</Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
