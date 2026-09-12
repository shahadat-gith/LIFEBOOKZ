import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../config/api';

const TOKEN_KEY = 'token';

const Ctx = createContext(undefined);

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
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // No token means there is no session to restore — skip the request so a
    // signed-out visitor never sends an unauthenticated call (and logs a 401).
    if (!getStoredToken()) {
      setIsLoading(false);
      return;
    }

    api.get('/admin/me')
      .then((res) => {
        setAdmin(res.data.data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setStoredToken(null);
        setAdmin(null);
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginAdmin = useCallback(async (email, password) => {
    const res = await api.post('/admin/login', { email, password });
    setStoredToken(res.data.data.token);
    setAdmin(res.data.data.admin || { role: 'admin' });
    setIsAuthenticated(true);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/admin/logout'); } catch { }
    setStoredToken(null);
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        admin,
        // The API sends the account role with every account payload.
        role: admin?.role || (isAuthenticated ? 'admin' : null),
        isAuthenticated,
        isLoading,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}

export default AuthProvider;
