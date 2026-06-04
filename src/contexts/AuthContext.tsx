import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: any;
  user: any;
  isInitializing: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
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
});

async function fetchCurrentUser(): Promise<any | null> {
  try {
    const res = await fetch('/api/auth/user', { credentials: 'include' });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.id) return null;
    return {
      id: data.id,
      email: data.email || `${data.id}@replit.user`,
      user_metadata: {
        full_name: [data.firstName, data.lastName].filter(Boolean).join(' ') || data.id,
        avatar_url: data.profileImageUrl || null,
      },
    };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsInitializing(true);
      const appUser = await fetchCurrentUser();
      if (appUser) {
        setUser(appUser);
        setSession({ access_token: 'replit_session', user: appUser });
      } else {
        setUser(null);
        setSession(null);
      }
      setIsInitializing(false);
    };

    initAuth();
  }, []);

  const signIn = async (_email: string, _password: string) => {
    window.location.href = '/api/login';
    return { error: null };
  };

  const signUp = async (_email: string, _password: string, _name: string) => {
    window.location.href = '/api/login';
    return { error: null, needsConfirmation: false };
  };

  const signInWithGoogle = async () => {
    window.location.href = '/api/login';
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    window.location.href = '/api/logout';
  };

  const resetPassword = async (_email: string) => {
    return { error: null };
  };

  const updatePassword = async (_password: string) => {
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ session, user, isInitializing, signOut, signIn, signUp, signInWithGoogle, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
