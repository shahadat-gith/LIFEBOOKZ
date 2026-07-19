import { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../utils/adminHelper';

const Ctx = createContext(undefined);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(() => setIsAuthenticated(true))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const loginAdmin = async (email, password) => {
    await adminApi.login({ email, password });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try { await adminApi.logout(); } catch { }
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
