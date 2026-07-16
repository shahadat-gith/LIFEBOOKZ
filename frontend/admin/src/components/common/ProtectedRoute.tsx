import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import LoadingScreen from './LoadingScreen';
interface P { children: ReactNode; }
export default function ProtectedRoute({ children }: P) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen message="Checking auth..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
