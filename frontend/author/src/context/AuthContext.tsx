import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import api from '../api/client';
import type { Author } from '../types';

interface AuthState { author: Author | null; isAuthenticated: boolean; isLoading: boolean; }
type Action = { type: 'SET_AUTHOR'; payload: Author } | { type: 'SET_LOADING'; payload: boolean } | { type: 'UPDATE_AUTHOR'; payload: Partial<Author> } | { type: 'LOGOUT' };

interface AuthContextType extends AuthState {
  loginAuthor: (email: string, password: string) => Promise<void>;
  registerAuthor: (data: Record<string, unknown> | FormData) => Promise<void>;
  logout: () => void;
  updateAuthor: (data: Partial<Author> | FormData) => Promise<void>;
}

const initialState: AuthState = { author: null, isAuthenticated: false, isLoading: true };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_AUTHOR': return { ...state, author: action.payload, isAuthenticated: true, isLoading: false };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'UPDATE_AUTHOR': return state.author ? { ...state, author: { ...state.author, ...action.payload } } : state;
    case 'LOGOUT': return { author: null, isAuthenticated: false, isLoading: false };
    default: return state;
  }
}

const AuthCtx = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    const restore = async () => {
      const data = localStorage.getItem('author');
      if (data && localStorage.getItem('authorAccessToken')) {
        try {
          const { data: p } = await api.get('/authors/me');
          dispatch({ type: 'SET_AUTHOR', payload: p });
          localStorage.setItem('author', JSON.stringify(p));
          return;
        } catch { /* */ }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    restore();
  }, []);

  const loginAuthor = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/authors/login', { email, password });
    localStorage.setItem('authorAccessToken', data.accessToken);
    localStorage.setItem('author', JSON.stringify(data.author));
    dispatch({ type: 'SET_AUTHOR', payload: data.author });
  }, []);

  const registerAuthor = useCallback(async (payload: Record<string, unknown> | FormData) => {
    const { data } = await api.post('/authors/register', payload);
    localStorage.setItem('authorAccessToken', data.accessToken);
    localStorage.setItem('author', JSON.stringify(data.author));
    dispatch({ type: 'SET_AUTHOR', payload: data.author });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authorAccessToken'); localStorage.removeItem('author');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateAuthor = useCallback(async (updates: Partial<Author> | FormData) => {
    const isFd = updates instanceof FormData;
    const { data } = await api.patch('/authors/me', updates, { headers: isFd ? { 'Content-Type': 'multipart/form-data' } : undefined });
    localStorage.setItem('author', JSON.stringify(data));
    dispatch({ type: 'UPDATE_AUTHOR', payload: data });
  }, []);

  return (<AuthCtx.Provider value={{ ...state, loginAuthor, registerAuthor, logout, updateAuthor }}>{children}</AuthCtx.Provider>);
}

export function useAuth() { const c = useContext(AuthCtx); if (!c) throw new Error('useAuth must be used within AuthProvider'); return c; }
export default AuthProvider;
