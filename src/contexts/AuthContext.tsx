import React, { createContext, useContext, useEffect, useState } from 'react';
import { post, get, setAuthToken, getStoredToken } from '../lib/apiClient';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
}

interface AuthContextType {
  session: { access_token: string } | null;
  user: AuthUser | null;
  isInitializing: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string, token?: string) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isInitializing: true,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false }),
  signInWithGoogle: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshUser = async () => {
    try {
      const me = await get<AuthUser>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
      setSession(null);
      setAuthToken(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      const token = getStoredToken();
      if (token) {
        setAuthToken(token);
        setSession({ access_token: token });
        try {
          const me = await get<AuthUser>('/auth/me');
          setUser(me);
        } catch {
          setAuthToken(null);
          setSession(null);
        }
      }
      setIsInitializing(false);
    };
    init();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await post<{ user: AuthUser; token: string }>('/auth/signin', { email, password });
      setAuthToken(res.token);
      setSession({ access_token: res.token });
      setUser(res.user);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const res = await post<{ user: AuthUser; token: string }>('/auth/signup', { email, password, full_name: name });
      setAuthToken(res.token);
      setSession({ access_token: res.token });
      setUser(res.user);
      return { error: null, needsConfirmation: false };
    } catch (err: any) {
      return { error: err.message || 'Sign up failed', needsConfirmation: false };
    }
  };

  const signInWithGoogle = async () => {
    throw new Error('Google sign-in not available. Please use email and password.');
  };

  const signOut = async () => {
    try { await post('/auth/signout'); } catch {}
    setAuthToken(null);
    setUser(null);
    setSession(null);
  };

  // Send forgot-password email via real API
  const resetPassword = async (email: string) => {
    try {
      await post('/auth/forgot-password', { email });
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to send reset email' };
    }
  };

  // If token provided → unauthenticated reset; otherwise → authenticated change
  const updatePassword = async (password: string, token?: string) => {
    try {
      if (token) {
        await post('/auth/reset-password', { token, password });
      } else {
        await post('/auth/change-password', { new_password: password });
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update password' };
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isInitializing, signOut, signIn, signUp, signInWithGoogle, resetPassword, updatePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
