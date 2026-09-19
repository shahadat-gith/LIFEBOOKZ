import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api from "../config/api";
import { resetSettingsCache } from "../hooks/useSettings";

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
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      resetSettingsCache();
      // No token means there is no session to restore — skip the request so a
      // signed-out visitor never sends an unauthenticated call (and logs a 401).
      if (!getStoredToken()) {
        setAuthor(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get("/authors/me");
        setAuthor(res.data.data);
      } catch {
        setStoredToken(null);
        setAuthor(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  /**
   * Signs in. Two-step accounts get `{ twoStepRequired, challengeId, email }`
   * back instead of a session — call `completeTwoStepLogin` with the code.
   */
  const login = useCallback(async (payload) => {
    const res = await api.post("/authors/login", payload);
    const data = res.data.data;

    if (data?.twoStepRequired) return data;

    resetSettingsCache();
    setStoredToken(data.token);
    setAuthor(data.author);
    return data;
  }, []);

  /** Second step of a two-step sign-in: exchange the emailed code for a session. */
  const completeTwoStepLogin = useCallback(async ({ challengeId, otp }) => {
    const res = await api.post("/authors/login/verify", { challengeId, otp });
    resetSettingsCache();
    setStoredToken(res.data.data.token);
    setAuthor(res.data.data.author);
    return res.data.data;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post("/authors/register", payload);
    resetSettingsCache();
    setStoredToken(res.data.data.token);
    setAuthor(res.data.data.author);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/authors/logout");
    } catch { /* token is cleared client-side */ }
    resetSettingsCache();
    setStoredToken(null);
    setAuthor(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await api.patch("/authors/me", payload);
    setAuthor(res.data.data);
  }, []);

  const value = useMemo(
    () => ({
      author,
      // The API sends the account role with every account payload; the
      // fallback keeps older sessions working.
      role: author?.role || (author ? "author" : null),
      isAuthenticated: author !== null,
      isLoading,
      login,
      completeTwoStepLogin,
      register,
      logout,
      updateProfile,
    }),
    [
      author,
      isLoading,
      login,
      completeTwoStepLogin,
      register,
      logout,
      updateProfile,
    ],
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
