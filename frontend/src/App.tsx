import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppLayout, { AuthLayout, MinimalLayout } from './layout/AppLayout';
import ProtectedRoute from './components/utilities/ProtectedRoute';
import LoadingScreen from './components/utilities/LoadingScreen';

// Lazy-loaded pages
import HomePage from './pages/HomePage';
import {
  LoginPage,
  RegisterPage,
  ProfilePage,
  PreferencesPage,
} from './modules/users';
import {
  AuthorDashboardPage,
  AuthorLoginPage,
  AuthorRegisterPage,
  AuthorProfilePage,
} from './modules/authors';
import {
  StoryListPage,
  StoryDetailPage,
  StoryCreatePage,
  StoryEditPage,
} from './modules/stories';
import { SearchResultsPage } from './modules/search';


function LazyFallback() {
  return <LoadingScreen message="Loading page..." />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            {/* App Layout */}
            <Route element={<AppLayout />}>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/stories" element={<StoryListPage />} />
              <Route path="/stories/:storyId" element={<StoryDetailPage />} />
              <Route path="/search" element={<SearchResultsPage />} />

              {/* Author - Protected */}
              <Route
                path="/stories/new"
                element={
                  <ProtectedRoute roles={['author']}>
                    <StoryCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stories/:storyId/edit"
                element={
                  <ProtectedRoute roles={['author']}>
                    <StoryEditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/dashboard"
                element={
                  <ProtectedRoute roles={['author']}>
                    <AuthorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/profile"
                element={
                  <ProtectedRoute roles={['author']}>
                    <AuthorProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* User - Protected */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute roles={['user']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferences"
                element={
                  <ProtectedRoute roles={['user']}>
                    <PreferencesPage />
                  </ProtectedRoute>
                }
              />

            </Route>

            {/* Auth Layout (centered forms) */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/author/login" element={<AuthorLoginPage />} />
              <Route path="/author/register" element={<AuthorRegisterPage />} />
            </Route>

            {/* Minimal Layout (no header/footer) */}
            <Route element={<MinimalLayout />}>
              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <h1 className="text-6xl font-bold text-foreground">404</h1>
                    <p className="text-muted-foreground">Page not found</p>
                    <a href="/" className="text-primary hover:underline text-sm">
                      Go home
                    </a>
                  </div>
                }
              />
            </Route>
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
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
