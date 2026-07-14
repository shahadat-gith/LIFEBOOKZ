import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api from '../lib/axios';
import type { User, Author, AuthRole } from '../constants/types';

interface AuthState {
  user: User | null;
  author: Author | null;
  admin: { email: string } | null;
  role: AuthRole;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_AUTHOR'; payload: Author }
  | { type: 'SET_ADMIN'; payload: { email: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_AUTHOR'; payload: Partial<Author> }
  | { type: 'LOGOUT' };

interface AuthContextType extends AuthState {
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, name: string) => Promise<void>;
  loginAuthor: (email: string, password: string) => Promise<void>;
  registerAuthor: (data: Record<string, unknown>) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateAuthor: (data: Partial<Author>) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAuthor: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  author: null,
  admin: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        author: null,
        admin: null,
        role: 'user',
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_AUTHOR':
      return {
        ...state,
        author: action.payload,
        user: null,
        admin: null,
        role: 'author',
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_ADMIN':
      return {
        ...state,
        admin: action.payload,
        user: null,
        author: null,
        role: 'admin',
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_USER':
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state;
    case 'UPDATE_AUTHOR':
      return state.author
        ? { ...state, author: { ...state.author, ...action.payload } }
        : state;
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore auth on mount
  useEffect(() => {
    const restoreAuth = async () => {
      const userData = localStorage.getItem('user');
      const authorData = localStorage.getItem('author');
      const adminData = localStorage.getItem('admin');

      if (adminData) {
        dispatch({ type: 'SET_ADMIN', payload: JSON.parse(adminData) });
        return;
      }

      if (userData && localStorage.getItem('accessToken')) {
        try {
          const { data } = await api.get('/users/me');
          dispatch({ type: 'SET_USER', payload: data });
          localStorage.setItem('user', JSON.stringify(data));
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }

      if (authorData && localStorage.getItem('authorAccessToken')) {
        try {
          const { data } = await api.get('/authors/me');
          dispatch({ type: 'SET_AUTHOR', payload: data });
          localStorage.setItem('author', JSON.stringify(data));
        } catch {
          localStorage.removeItem('author');
          localStorage.removeItem('authorAccessToken');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    };

    restoreAuth();
  }, []);

  const loginUser = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch({ type: 'SET_USER', payload: data.user });
  }, []);

  const registerUser = useCallback(
    async (email: string, password: string, name: string) => {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        name,
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'SET_USER', payload: data.user });
    },
    []
  );

  const loginAuthor = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/authors/login', { email, password });
    localStorage.setItem('authorAccessToken', data.accessToken);
    localStorage.setItem('author', JSON.stringify(data.author));
    dispatch({ type: 'SET_AUTHOR', payload: data.author });
  }, []);

  const registerAuthor = useCallback(
    async (formData: Record<string, unknown>) => {
      const { data } = await api.post('/authors/register', formData);
      localStorage.setItem('authorAccessToken', data.accessToken);
      localStorage.setItem('author', JSON.stringify(data.author));
      dispatch({ type: 'SET_AUTHOR', payload: data.author });
    },
    []
  );

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem('admin', JSON.stringify(data.admin));
    localStorage.setItem('accessToken', data.token);
    dispatch({ type: 'SET_ADMIN', payload: data.admin });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authorAccessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('author');
    localStorage.removeItem('admin');
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

  const updateAuthor = useCallback(async (updates: Partial<Author> | FormData) => {
    const isFormData = updates instanceof FormData;
    const { data } = await api.patch('/authors/me', updates, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    localStorage.setItem('author', JSON.stringify(data));
    dispatch({ type: 'UPDATE_AUTHOR', payload: data });
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

  const refreshAuthor = useCallback(async () => {
    try {
      const { data } = await api.get('/authors/me');
      localStorage.setItem('author', JSON.stringify(data));
      dispatch({ type: 'SET_AUTHOR', payload: data });
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginUser,
        registerUser,
        loginAuthor,
        registerAuthor,
        loginAdmin,
        logout,
        updateUser,
        updateAuthor,
        refreshUser,
        refreshAuthor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthProvider;
