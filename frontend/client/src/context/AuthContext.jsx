import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from "../config/axios";

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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data.data);
      } catch {
        // No valid session (expired/absent token) — clear stale token
        setStoredToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  const loginUser = useCallback(async (email, password) => {
    const res = await api.post('/users/login', { email, password });
    setStoredToken(res.data.data.token);
    setUser(res.data.data.user);
  }, []);

  const registerUser = useCallback(async (data) => {
    // Let axios auto-detect FormData and set the correct Content-Type with boundary
    const res = await api.post('/users/register', data);
    setStoredToken(res.data.data.token);
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/users/logout');
    } catch { /* */ }
    setStoredToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    const res = await api.patch('/users/me', updates);
    setUser(res.data.data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, loginUser, registerUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}

export default AuthProvider;
