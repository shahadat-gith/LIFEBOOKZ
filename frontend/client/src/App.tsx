import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppLayout, { AuthLayout, MinimalLayout } from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Preferences from './pages/Preferences';
import StoryList from './pages/StoryList';
import StoryDetail from './pages/StoryDetail';
import SearchResults from './pages/SearchResults';

function LazyFallback() { return <LoadingScreen message="Loading page..." />; }

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/stories" element={<StoryList />} />
              <Route path="/stories/:storyId" element={<StoryDetail />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/profile" element={<ProtectedRoute roles={['user']}><Profile /></ProtectedRoute>} />
              <Route path="/preferences" element={<ProtectedRoute roles={['user']}><Preferences /></ProtectedRoute>} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<MinimalLayout />}>
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                  <h1 className="text-6xl font-bold text-foreground">404</h1>
                  <p className="text-muted-foreground">Page not found</p>
                  <a href="/" className="text-primary hover:underline text-sm">Go home</a>
                </div>
              } />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }, success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } }, error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;
