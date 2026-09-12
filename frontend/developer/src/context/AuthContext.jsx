import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api from "../config/api";

const TOKEN_KEY = "token";

const AuthContext = createContext(undefined);

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch { /* storage unavailable */ }
}

export function AuthProvider({ children }) {
  const [developer, setDeveloper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      // No token means there is no session to restore — skip the request so a
      // signed-out visitor never sends an unauthenticated call (and logs a 401).
      if (!getStoredToken()) {
        setDeveloper(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get("/developer/me");
        setDeveloper(res.data.data);
      } catch {
        setStoredToken(null);
        setDeveloper(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/developer/login", { email, password });
    setStoredToken(res.data.data.token);
    setDeveloper(res.data.data.developer);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/developer/logout");
    } catch { /* token is cleared client-side */ }
    setStoredToken(null);
    setDeveloper(null);
  }, []);

  const value = useMemo(
    () => ({
      developer,
      // The API sends the account role with every account payload; the
      // fallback keeps older sessions working.
      role: developer?.role || (developer ? "developer" : null),
      isAuthenticated: developer !== null,
      isLoading,
      login,
      logout,
    }),
    [developer, isLoading, login, logout],
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
