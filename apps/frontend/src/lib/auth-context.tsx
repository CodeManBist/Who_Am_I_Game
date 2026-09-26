import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type AuthUser = {
  username: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (username: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'whoami-auth';
const USERS_KEY = 'whoami-users';

type StoredUser = AuthUser & { password: string };

function loadUsers(): StoredUser[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  // Seed demo users
  const demoUsers: StoredUser[] = [
    { username: 'Sagar', email: 'sagar@demo.com', password: 'demo123' },
    { username: 'Rahul', email: 'rahul@demo.com', password: 'demo123' },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  return demoUsers;
}

function saveUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const users = loadUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!found) return { ok: false, error: 'No account found with that email.' };
    if (found.password !== password) return { ok: false, error: 'Wrong password.' };
    const loggedIn: AuthUser = { username: found.username, email: found.email };
    setUser(loggedIn);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    } catch {
      // ignore
    }
    return { ok: true };
  }, []);

  const register = useCallback(
    (username: string, email: string, password: string): { ok: boolean; error?: string } => {
      const users = loadUsers();
      const exists = users.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (exists) return { ok: false, error: 'An account with that email already exists.' };
      const newUser: StoredUser = {
        username: username.trim() || 'Player',
        email: email.trim(),
        password,
      };
      const updated = [...users, newUser];
      saveUsers(updated);
      const loggedIn: AuthUser = { username: newUser.username, email: newUser.email };
      setUser(loggedIn);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
      } catch {
        // ignore
      }
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
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
        login,
        register,
        logout,
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
