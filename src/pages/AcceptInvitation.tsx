import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

export const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, signOut, signUp } = useAuth();
  const { refreshWorkspaces } = useWorkspace();

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // Fetch invite details from real API
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid or expired invite link.');
        } else {
          setInviteDetails(data);
        }
      } catch {
        setError('Failed to load invitation. Please check your link and try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  // Accept invite for already-logged-in user
  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setError(null);
    try {
      const storedToken = localStorage.getItem('astrix_token') || '';
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation');
        setIsAccepting(false);
        return;
      }
      await refreshWorkspaces();
      setSuccessMsg(`You've joined ${inviteDetails?.workspace_name}! Redirecting...`);
      setTimeout(() => navigate('/app'), 1500);
    } catch {
      setError('Failed to accept invitation. Please try again.');
      setIsAccepting(false);
    }
  };

  // Sign up + accept for new users
  const handleSignupAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteDetails?.email || !password || !name) return;
    setIsAccepting(true);
    setError(null);

    const { error: signUpError } = await signUp(inviteDetails.email, password, name);
    if (signUpError) {
      setError(signUpError);
      setIsAccepting(false);
      return;
    }

    // Now accept the invite
    await handleAccept();
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          <p className="mt-4 text-sm font-bold text-gray-500">Verifying invitation...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error && !inviteDetails) {
    return (
      <AuthLayout>
        <div className="bg-white p-8 rounded-3xl shadow-apple border border-gray-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/" className="text-brand-blue font-bold hover:underline text-sm">Go to Homepage</Link>
        </div>
      </AuthLayout>
    );
  }

  const isExistingUser = !!user;
  const isEmailMatch = user?.email?.toLowerCase() === inviteDetails?.email?.toLowerCase();

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    maker: 'Member',
    viewer: 'Viewer',
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">

        {/* Workspace + invite info header */}
        <div className="flex flex-col items-center text-center mb-8 border-b border-gray-100 pb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-400 flex items-center justify-center font-heading font-black text-white text-2xl shadow-lg shadow-brand-blue/30 mb-4">
            {inviteDetails?.workspace_name?.charAt(0).toUpperCase() || 'W'}
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            <span className="text-brand-blue">{inviteDetails?.inviter_name || 'Someone'}</span> invited you
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Join <span className="font-bold text-gray-800">{inviteDetails?.workspace_name}</span> on Astrix AI as a{' '}
            <span className="font-bold text-gray-700">{ROLE_LABELS[inviteDetails?.role] || inviteDetails?.role}</span>.
          </p>
          <div className="mt-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Invite for <span className="font-bold text-gray-800">{inviteDetails?.email}</span></span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {successMsg ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-bold text-green-700 mb-6">{successMsg}</p>
            <Loader2 className="w-5 h-5 animate-spin text-brand-blue mx-auto" />
          </div>

        ) : isExistingUser ? (
          /* Logged in — one-click accept */
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-6">
              Signed in as <span className="font-bold text-gray-900">{user.email}</span>
            </p>
            {isEmailMatch ? (
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none h-[52px]"
              >
                {isAccepting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accept & Join Workspace'}
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm font-medium mb-4">
                This invite was sent to <strong>{inviteDetails?.email}</strong>. Please sign out and sign in with that account.
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="mt-4 text-sm text-gray-500 font-bold hover:text-gray-900 transition-colors"
            >
              Sign out →
            </button>
          </div>

        ) : (
          /* Not logged in — sign up or log in */
          <div className="space-y-4">
            <form onSubmit={handleSignupAndAccept} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all outline-none placeholder-gray-400"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="password">Create Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all outline-none placeholder-gray-400"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={isAccepting || !name || password.length < 8}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none h-[52px]"
              >
                {isAccepting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account & Join'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              Already have an account?{' '}
              <Link to={`/login?redirect=/accept-invitation?token=${token}`} className="text-brand-blue font-bold hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
