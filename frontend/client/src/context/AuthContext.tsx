import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api from '../api/client';
import type { User } from '../types';

type AuthRole = 'user' | null;

interface AuthState {
  user: User | null;
  role: AuthRole;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'LOGOUT' };

interface AuthContextType extends AuthState {
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User> | FormData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, role: 'user', isAuthenticated: true, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_USER':
      return state.user ? { ...state, user: { ...state.user, ...action.payload } } : state;
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const restoreAuth = async () => {
      const userData = localStorage.getItem('user');
      if (userData && localStorage.getItem('accessToken')) {
        try {
          const { data } = await api.get('/users/me');
          dispatch({ type: 'SET_USER', payload: data });
          localStorage.setItem('user', JSON.stringify(data));
          return;
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    restoreAuth();
  }, []);

  const loginUser = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/users/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch({ type: 'SET_USER', payload: data.user });
  }, []);

  const registerUser = useCallback(async (email: string, password: string, name: string) => {
    const { data } = await api.post('/users/register', { email, password, name });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch({ type: 'SET_USER', payload: data.user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback(async (updates: Partial<User> | FormData) => {
    const isFormData = updates instanceof FormData;
    const { data } = await api.patch('/users/me', updates, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    localStorage.setItem('user', JSON.stringify(data));
    dispatch({ type: 'UPDATE_USER', payload: data });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      localStorage.setItem('user', JSON.stringify(data));
      dispatch({ type: 'SET_USER', payload: data });
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, loginUser, registerUser, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export type { AuthRole };
export default AuthProvider;
