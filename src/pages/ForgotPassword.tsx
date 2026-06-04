import React from 'react';
import { AuthLayout } from '../layouts/AuthLayout';

export const ForgotPassword = () => {
  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">Reset password.</h1>
          <p className="text-gray-500 text-sm font-medium">Password reset is handled via your login provider.</p>
        </div>
        <a
          href="/api/login"
          className="w-full flex items-center justify-center gap-3 bg-brand-blue text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/20 shadow-glow-blue btn-shine"
        >
          Back to Log In
        </a>
      </div>
    </AuthLayout>
  );
};
