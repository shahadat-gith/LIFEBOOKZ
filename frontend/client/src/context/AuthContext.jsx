import { createContext, useContext, useState, useEffect } from 'react';
import api from "../config/axios";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data.data);
      } catch {
        // No valid cookie, not logged in
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  const loginUser = async (email, password) => {
    const res = await api.post('/users/login', { email, password });
    setUser(res.data.data.user);
  };

  const registerUser = async (data) => {
    // Let axios auto-detect FormData and set the correct Content-Type with boundary
    const res = await api.post('/users/register', data);
    setUser(res.data.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/users/logout');
    } catch { /* */ }
    setUser(null);
  };

  const updateUser = async (updates) => {
    const res = await api.patch('/users/me', updates);
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
