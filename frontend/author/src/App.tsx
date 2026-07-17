import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppLayout, { AuthLayout, HomeLayout } from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const StoryEditor = lazy(() => import('./pages/StoryEditor'));

function LazyFallback() { return <LoadingScreen message="Loading..." />; }

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route element={<HomeLayout />}>
              <Route path="/" element={<Home />} />
            </Route>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/stories/new" element={<ProtectedRoute><StoryEditor /></ProtectedRoute>} />
              <Route path="/stories/:storyId/edit" element={<ProtectedRoute><StoryEditor /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="*" element={<div className="flex flex-col items-center justify-center min-h-screen gap-4"><h1 className="text-6xl font-bold">404</h1><p className="text-muted-foreground">Page not found</p><a href="/" className="text-primary hover:underline">Go to Home</a></div>} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
