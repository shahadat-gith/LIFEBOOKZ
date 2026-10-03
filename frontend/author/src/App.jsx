import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppLayout, { AuthLayout } from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingScreen from "./components/common/LoadingScreen";
import ScrollToTop from "./components/common/ScrollToTop";

const Home = lazy(() => import("./pages/Home"));
const Feed = lazy(() => import("./pages/Feed"));
const StoryDashboard = lazy(() => import("./pages/StoryDashboard"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const AuthorProfile = lazy(() => import("./pages/AuthorProfile"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const StoryEditor = lazy(() => import("./pages/StoryEditor"));

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
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            {/* legacy aliases for the home route */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-stories"
              element={
                <ProtectedRoute>
                  <StoryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed/story/:slug"
              element={
                <ProtectedRoute>
                  <StoryDetail />
                </ProtectedRoute>
              }
            />
            {/* An author's public profile — reached from an author's name */}
            <Route
              path="/authors/:id"
              element={
                <ProtectedRoute>
                  <AuthorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stories/new"
              element={
                <ProtectedRoute>
                  <StoryEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stories/:storyId/edit"
              element={
                <ProtectedRoute>
                  <StoryEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* Profile edit / completion is a full page (cropping needs the room) */}
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-6xl font-bold">404</h1>
                <p className="text-muted-foreground">Page not found</p>
                <a href="/" className="text-primary hover:underline">
                  Go to Home
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
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}
