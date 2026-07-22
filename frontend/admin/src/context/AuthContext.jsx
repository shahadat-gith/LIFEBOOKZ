import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const Ctx = createContext(undefined);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(() => setIsAuthenticated(true))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const loginAdmin = async (email, password) => {
    const res = await api.post('/admin/login', { email, password });
    setIsAuthenticated(true);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/admin/logout'); } catch { }
    setIsAuthenticated(false);
  };

  return (
    <Ctx.Provider value={{ isAuthenticated, isLoading, loginAdmin, logout }}>
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
