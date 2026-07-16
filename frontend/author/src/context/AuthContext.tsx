import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as api from "../api/auth";

import type { Author, LoginRequest } from "../types";

interface AuthContextType {
  author: Author | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: FormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: FormData | Partial<Author>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [author, setAuthor] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const author = await api.getMe();
        setAuthor(author);
      } catch {
        setAuthor(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (payload: LoginRequest) => {
    const { author } = await api.login(payload);
    setAuthor(author);
  };

  const register = async (payload: FormData) => {
    const { author } = await api.register(payload);
    setAuthor(author);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAuthor(null);
    }
  };

  const updateProfile = async (payload: FormData | Partial<Author>) => {
    const author = await api.updateMe(payload);
    setAuthor(author);
  };

  const value = useMemo(
    () => ({
      author,
      isAuthenticated: author !== null,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
    }),
    [author, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
