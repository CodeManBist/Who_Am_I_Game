import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const API_URL = "http://localhost:3001/api/v1";

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