import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type AuthUser = {
  phone: string;
  name: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => void;
  verifyOtp: (phone: string, code: string, name: string) => boolean;
  logout: () => void;
  pendingPhone: string | null;
  generatedOtp: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'whoami-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  const sendOtp = useCallback((phone: string) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setPendingPhone(phone);
    setGeneratedOtp(code);
  }, []);

  const verifyOtp = useCallback(
    (phone: string, code: string, name: string) => {
      if (code !== generatedOtp) return false;
      const newUser = { phone, name: name || 'Player' };
      setUser(newUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } catch {
        // ignore storage errors
      }
      setPendingPhone(null);
      setGeneratedOtp(null);
      return true;
    },
    [generatedOtp]
  );

  const logout = useCallback(() => {
    setUser(null);
    setPendingPhone(null);
    setGeneratedOtp(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        sendOtp,
        verifyOtp,
        logout,
        pendingPhone,
        generatedOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
