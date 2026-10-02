import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AdminLayout, { AuthLayout } from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';
import ScrollToTop from './components/common/ScrollToTop';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Authors = lazy(() => import('./pages/Authors'));
const Experts = lazy(() => import('./pages/Experts'));
const Users = lazy(() => import('./pages/Users'));
const Stories = lazy(() => import('./pages/Stories'));

function LazyFallback() {
  return <LoadingScreen message="Loading..." />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/authors"
              element={
                <ProtectedRoute>
                  <Authors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/experts"
              element={
                <ProtectedRoute>
                  <Experts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/stories"
              element={
                <ProtectedRoute>
                  <Stories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="*"
            element={
              <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
                <h1 className="text-6xl font-bold text-foreground">404</h1>
                <p className="text-muted-foreground">Page not found</p>
                <a href="/dashboard" className="text-sm text-accent hover:underline">
                  Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            background: '#1a1a1a',
            color: '#e5e5e5',
            border: '1px solid #2a2a2a',
          },
        }}
      />
    </>
  );
}
