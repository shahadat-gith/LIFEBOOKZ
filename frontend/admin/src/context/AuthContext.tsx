import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { adminApi } from '../api/admin';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session via the cookie
  useEffect(() => {
    adminApi.getDashboard()
      .then(() => setIsAuthenticated(true))
      .catch(() => { /* No valid cookie */ })
      .finally(() => setIsLoading(false));
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    await adminApi.login({ email, password });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch { /* */ }
    setIsAuthenticated(false);
  };

  return <Ctx.Provider value={{ isAuthenticated, isLoading, loginAdmin, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}

export default AuthProvider;
