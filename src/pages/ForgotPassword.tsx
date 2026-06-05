import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { ArrowLeft, MailCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    await resetPassword(email);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>

        {!isSubmitted ? (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">Reset password.</h1>
              <p className="text-gray-500 text-sm font-medium">Enter your email and we'll send you a reset link.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2" htmlFor="email">Work Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all outline-none placeholder-gray-400"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 disabled:cursor-not-allowed font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none h-[52px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MailCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm font-medium mb-8">
              We sent a reset link to <span className="font-bold text-gray-900">{email}</span>
            </p>
            <button onClick={() => setIsSubmitted(false)} className="text-sm text-brand-blue font-bold hover:underline">
              Didn't receive it? Resend.
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
