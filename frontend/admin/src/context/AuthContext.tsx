import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import api from '../api/client';

interface AuthState { admin: { email: string } | null; isAuthenticated: boolean; isLoading: boolean; }
type Action = { type: 'SET_ADMIN'; payload: { email: string } } | { type: 'LOGOUT' } | { type: 'SET_LOADING'; payload: boolean };
interface Ctx extends AuthState { loginAdmin: (email: string, password: string) => Promise<void>; logout: () => void; }

const init: AuthState = { admin: null, isAuthenticated: false, isLoading: false };
function reducer(s: AuthState, a: Action): AuthState {
  switch (a.type) {
    case 'SET_ADMIN': return { ...s, admin: a.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT': return init;
    case 'SET_LOADING': return { ...s, isLoading: a.payload };
    default: return s;
  }
}

const Ctx = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, init);
  const loginAdmin = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem('admin', JSON.stringify(data.admin));
    localStorage.setItem('accessToken', data.token);
    dispatch({ type: 'SET_ADMIN', payload: data.admin });
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem('admin'); localStorage.removeItem('accessToken');
    dispatch({ type: 'LOGOUT' });
  }, []);
  return <Ctx.Provider value={{ ...state, loginAdmin, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() { const c = useContext(Ctx); if (!c) throw new Error('useAuth must be used within AuthProvider'); return c; }
export default AuthProvider;
