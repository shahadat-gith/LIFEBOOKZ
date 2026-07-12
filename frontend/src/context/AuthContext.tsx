import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api from '../lib/axios';

// ---- Types ----
export interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  avatar: string;
  preferences: {
    interests: string[];
    profession: string;
    education: string[];
    skills: string[];
    goals: string[];
    languages: string[];
    location: { country: string; city: string };
  };
  createdAt: string;
}

export interface Author {
  _id: string;
  id: string;
  email: string;
  fullName: string;
  avatar: string;
  bio: string;
  website: string;
  socialLinks: { x: string; github: string; linkedin: string };
  kyc: {
    dateOfBirth?: string;
    phoneNumber?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    governmentId?: {
      type: string;
      number: string;
      documentUrl: string;
    };
  };
  verification: {
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    verifiedAt?: string;
  };
  createdAt: string;
}

export type AuthRole = 'user' | 'author' | 'admin' | null;

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
          localStorage.removeItem('refreshToken');
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
          localStorage.removeItem('authorRefreshToken');
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
    localStorage.setItem('refreshToken', data.refreshToken);
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
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch({ type: 'SET_USER', payload: data.user });
    },
    []
  );

  const loginAuthor = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/authors/login', { email, password });
    localStorage.setItem('authorAccessToken', data.accessToken);
    localStorage.setItem('authorRefreshToken', data.refreshToken);
    localStorage.setItem('author', JSON.stringify(data.author));
    dispatch({ type: 'SET_AUTHOR', payload: data.author });
  }, []);

  const registerAuthor = useCallback(
    async (formData: Record<string, unknown>) => {
      const { data } = await api.post('/authors/register', formData);
      localStorage.setItem('authorAccessToken', data.accessToken);
      localStorage.setItem('authorRefreshToken', data.refreshToken);
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
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authorAccessToken');
    localStorage.removeItem('authorRefreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('author');
    localStorage.removeItem('admin');
    dispatch({ type: 'LOGOUT' });
    api.post('/auth/logout').catch(() => {});
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    const { data } = await api.patch('/users/me', updates);
    localStorage.setItem('user', JSON.stringify(data));
    dispatch({ type: 'UPDATE_USER', payload: data });
  }, []);

  const updateAuthor = useCallback(async (updates: Partial<Author>) => {
    const { data } = await api.patch('/authors/me', updates);
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
