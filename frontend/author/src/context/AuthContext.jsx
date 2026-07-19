import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../config/api";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get("/authors/me");
        setAuthor(res.data.data);
      } catch {
        setAuthor(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (payload) => {
    const res = await api.post("/authors/login", payload);
    setAuthor(res.data.data.author);
  };

  const register = async (payload) => {
    const res = await api.post("/authors/register", payload);
    setAuthor(res.data.data.author);
  };

  const logout = async () => {
    try {
      await api.post("/authors/logout");
    } finally {
      setAuthor(null);
    }
  };

  const updateProfile = async (payload) => {
    const res = await api.patch("/authors/me", payload);
    setAuthor(res.data.data);
  };

  const value = useMemo(
    () => ({ author, isAuthenticated: author !== null, isLoading, login, register, logout, updateProfile }),
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

export default AuthProvider;
