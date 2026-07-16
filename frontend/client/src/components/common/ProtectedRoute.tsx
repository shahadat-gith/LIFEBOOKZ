import { Navigate, type ReactNode } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from './LoadingScreen';

interface P { children: ReactNode; roles?: ('user' | 'admin')[]; }

export function ProtectedRoute({ children, roles }: P) {
  const { isAuthenticated, role, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen fullScreen message="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
export default ProtectedRoute;
