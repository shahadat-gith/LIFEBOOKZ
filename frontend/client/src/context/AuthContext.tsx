import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (data: FormData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User> | FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session — the cookie is sent automatically
  useEffect(() => {
    const restore = async () => {
      try {
        const res = await authApi.getMe();
        setUser(res.data.data);
      } catch {
        // No valid cookie, not logged in
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  const loginUser = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.data.data.user);
  };

  const registerUser = async (data: FormData) => {
    const res = await authApi.register(data);
    setUser(res.data.data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch { /* */ }
    setUser(null);
  };

  const updateUser = async (updates: Partial<User> | FormData) => {
    const res = await userApi.updateMe(updates);
    setUser(res.data.data);
  };

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
