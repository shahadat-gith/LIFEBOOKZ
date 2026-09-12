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
  const [expert, setExpert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      // No token means there is no session to restore — skip the request so a
      // signed-out visitor never sends an unauthenticated call (and logs a 401).
      if (!getStoredToken()) {
        setExpert(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get("/experts/me");
        setExpert(res.data.data);
      } catch {
        setStoredToken(null);
        setExpert(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (payload) => {
    const res = await api.post("/experts/login", payload);
    setStoredToken(res.data.data.token);
    setExpert(res.data.data.expert);
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post("/experts/register", payload);
    setStoredToken(res.data.data.token);
    setExpert(res.data.data.expert);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/experts/logout");
    } catch { /* token is cleared client-side */ }
    setStoredToken(null);
    setExpert(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await api.patch("/experts/me", payload);
    setExpert(res.data.data);
  }, []);

  const value = useMemo(
    () => ({
      expert,
      // The API sends the account role with every account payload; the
      // fallback keeps older sessions working.
      role: expert?.role || (expert ? "expert" : null),
      isAuthenticated: expert !== null,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
    }),
    [expert, isLoading, login, register, logout, updateProfile],
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
