import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import LoadingScreen from './LoadingScreen';
interface P { children: ReactNode; roles?: string[]; }
export function ProtectedRoute({ children, roles }: P) {
  const { isAuthenticated, isLoading, author } = useAuth();
  if (isLoading) return <LoadingScreen message="Checking auth..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && author && !roles.includes('author')) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
export default ProtectedRoute;
