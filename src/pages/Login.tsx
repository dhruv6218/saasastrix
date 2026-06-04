import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Sparkles } from 'lucide-react';

export const Login = () => {
  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome back.</h1>
          <p className="text-gray-500 text-sm font-medium">Sign in to your Astrix workspace.</p>
        </div>

        <a
          href="/api/login"
          className="w-full flex items-center justify-center gap-3 bg-brand-blue text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/20 mb-6 shadow-glow-blue btn-shine"
        >
          Log In
        </a>

        <p className="text-sm text-gray-500 font-medium text-center mt-8 mb-6">
          Don't have an account?{' '}
          <a href="/api/login" className="text-brand-blue font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-sm">
            Start free →
          </a>
        </p>

        <div className="pt-6 border-t border-gray-100">
          <Link to="/signup?demo=true" className="w-full flex items-center justify-center gap-2 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-gray-200">
            <Sparkles className="w-4 h-4 text-brand-blue" /> Book a Demo
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
