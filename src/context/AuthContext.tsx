import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  role: 'citizen' | 'admin';
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  officer_id?: string;
  created_at?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'citizen' | 'admin') => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'citizen' | 'admin';
  department?: string;
  designation?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'jansetu_auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on first load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user && parsed.token) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (u: AuthUser, t: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
  };

  const login = async (email: string, password: string, role: 'citizen' | 'admin') => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        persist(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed.' };
    } catch {
      return { success: false, error: 'Network error. Is the server running?' };
    }
  };

  const signup = async (signupData: SignupData) => {
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      const data = await res.json();
      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        persist(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed.' };
    } catch {
      return { success: false, error: 'Network error. Is the server running?' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
