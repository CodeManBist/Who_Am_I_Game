import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const API_URL = "http://localhost:3001/api/v1";
const REFRESH_EARLY_MS = 5 * 60 * 1000;

function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(atob(base64)) as { exp?: number };
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isGameSessionPath(path: string) {
  return /^\/game\/[^/]+(?:\/result)?\/?$/.test(path) || /^\/room\/[^/]+\/countdown\/?$/.test(path);
}

type AuthUser = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
};

type AuthResult = {
  ok: boolean;
  error?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<AuthResult>;

  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;

  logout: () => void;
};

/* --------------------------------------------------
   Context
-------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

/* --------------------------------------------------
   Provider
-------------------------------------------------- */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ------------------------------------------------
     Restore authentication from localStorage
  ------------------------------------------------ */

  useEffect(() => {
    const storedToken = localStorage.getItem("whoami-token");
    const storedUser = localStorage.getItem("whoami-user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem("whoami-user");
      }
    }

    setIsLoading(false);
  }, []);

  // Refresh before expiry. If a refresh cannot complete while the player is
  // in a game, preserve that session and defer the login redirect until they
  // leave the game flow.
  useEffect(() => {
    if (!token) return;
    let refreshTimer: number | undefined;
    let expiryTimer: number | undefined;
    const expiresAt = tokenExpiry(token);

    const expireOutsideGame = () => {
      if (isGameSessionPath(window.location.pathname)) return;
      localStorage.removeItem('whoami-token');
      localStorage.removeItem('whoami-user');
      setToken(null);
      setUser(null);
      if (!window.location.pathname.startsWith('/auth')) {
        const redirect = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/auth?redirect=${encodeURIComponent(redirect)}`);
      }
    };

    const refresh = async () => {
      if (!expiresAt) {
        expireOutsideGame();
        return;
      }
      if (Date.now() >= expiresAt) {
        expireOutsideGame();
        refreshTimer = window.setTimeout(() => void refresh(), 30_000);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && typeof data.token === 'string') {
          localStorage.setItem('whoami-token', data.token);
          setToken(data.token);
          return;
        }
      } catch (error) {
        console.error('Session refresh failed:', error);
      }
      refreshTimer = window.setTimeout(() => void refresh(), Math.min(30_000, Math.max(1000, expiresAt - Date.now())));
    };

    refreshTimer = window.setTimeout(() => void refresh(), Math.max(0, (expiresAt ?? Date.now()) - Date.now() - REFRESH_EARLY_MS));
    expiryTimer = window.setInterval(() => {
      if (!expiresAt || Date.now() >= expiresAt) expireOutsideGame();
    }, 5000);
    return () => {
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      if (expiryTimer !== undefined) window.clearInterval(expiryTimer);
    };
  }, [token]);

  /* ------------------------------------------------
     Save authentication
  ------------------------------------------------ */

  const saveAuth = (
    newToken: string,
    newUser: AuthUser
  ) => {
    localStorage.setItem("whoami-token", newToken);
    localStorage.setItem(
      "whoami-user",
      JSON.stringify(newUser)
    );

    setToken(newToken);
    setUser(newUser);
  };

  /* ------------------------------------------------
     Login
  ------------------------------------------------ */

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            passwordHash: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error:
            data?.error ||
            data?.message ||
            "Login failed",
        };
      }

      if (!data.token) {
        return {
          ok: false,
          error: "Login succeeded but no token was returned",
        };
      }

      /*
       * Get the authenticated user's actual profile
       * using the JWT returned by login.
       */

      const meResponse = await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        return {
          ok: false,
          error:
            meData?.error ||
            meData?.message ||
            "Could not fetch user profile",
        };
      }

      const authenticatedUser: AuthUser =
        meData.user;

      saveAuth(data.token, authenticatedUser);

      return {
        ok: true,
      };
    } catch (error) {
      console.error("Login error:", error);

      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect to server",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------
     Register
  ------------------------------------------------ */

  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            passwordHash: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error:
            data?.error ||
            data?.message ||
            "Registration failed",
        };
      }

      if (!data.token) {
        return {
          ok: false,
          error:
            "Registration succeeded but no token was returned",
        };
      }

      /*
       * Registration also returns a JWT.
       * Fetch the newly created user's profile.
       */

      const meResponse = await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        return {
          ok: false,
          error:
            meData?.error ||
            meData?.message ||
            "Could not fetch user profile",
        };
      }

      const authenticatedUser: AuthUser =
        meData.user;

      saveAuth(data.token, authenticatedUser);

      return {
        ok: true,
      };
    } catch (error) {
      console.error("Registration error:", error);

      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect to server",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------
     Logout
  ------------------------------------------------ */

  const logout = () => {
    localStorage.removeItem("whoami-token");
    localStorage.removeItem("whoami-user");

    setToken(null);
    setUser(null);
  };

  /* ------------------------------------------------
     Context value
  ------------------------------------------------ */

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* --------------------------------------------------
   Hook
-------------------------------------------------- */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
