import { Navigate, type ReactNode } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from './LoadingScreen';
import type { AuthRole } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: AuthRole[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen fullScreen message="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && role && !roles.includes(role)) {
    // Redirect to appropriate dashboard
    if (role === 'author') return <Navigate to="/author/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
