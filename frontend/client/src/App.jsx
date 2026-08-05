import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { FollowingProvider } from './context/FollowingContext';
import AppLayout, { AuthLayout, MinimalLayout } from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';
import NotFound from './pages/NotFound';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StoryList from './pages/StoryList';

import SearchResults from './pages/SearchResults';
import Feed from './pages/Feed';
import StoryDetail from './pages/StoryDetail';
import Trending from './pages/Trending';
import AuthorProfile from './pages/AuthorProfile';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ContentPolicy from './pages/ContentPolicy';

function LazyFallback() { return <LoadingScreen message="Loading page..." />; }

// Scroll back to the top whenever the route (URL) changes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export function App() {
 return (
  <BrowserRouter>
   <ScrollToTop />
   <AuthProvider>
    <FollowingProvider>
    <Suspense fallback={<LazyFallback />}>
     <Routes>
      <Route element={<AppLayout />}>
       <Route path="/" element={<Home />} />
       <Route path="/stories" element={<StoryList />} />
       {/* Feed is the single source of truth - story detail is shown directly in the feed */}
       <Route path="/search" element={<SearchResults />} />
       <Route path="/feed" element={<Feed />} />
       <Route path="/feed/story/:slug" element={<StoryDetail />} />
       <Route path="/trending" element={<Trending />} />
       <Route path="/authors/:id" element={<AuthorProfile />} />
       <Route path="/about" element={<About />} />
       <Route path="/privacy" element={<PrivacyPolicy />} />
       <Route path="/terms" element={<TermsOfService />} />
       <Route path="/guidelines" element={<ContentPolicy />} />
      </Route>
      <Route element={<AuthLayout />}>
       <Route path="/login" element={<Login />} />
       <Route path="/register" element={<Register />} />
       <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route element={<MinimalLayout />}>
       <Route path="*" element={<NotFound />} />
      </Route>
     </Routes>
    </Suspense>
    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }, success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } }, error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } } }} />
   </FollowingProvider>
   </AuthProvider>
  </BrowserRouter>
 );
}
export default App;
