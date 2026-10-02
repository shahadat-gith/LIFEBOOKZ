import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AppLayout, { AuthLayout } from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';
import ScrollToTop from './components/common/ScrollToTop';

const Login = lazy(() => import('./pages/Login'));
const Logs = lazy(() => import('./pages/Logs'));

function LazyFallback() {
  return <LoadingScreen message="Loading..." />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <Logs />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="/" element={<Navigate to="/logs" replace />} />
          <Route
            path="*"
            element={
              <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
                <h1 className="text-6xl font-bold text-foreground">404</h1>
                <p className="text-muted-foreground">Page not found</p>
                <a href="/logs" className="text-sm text-accent hover:underline">
                  Application logs
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
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
        }}
      />
    </>
  );
}
