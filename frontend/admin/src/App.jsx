import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminLayout, { AuthLayout } from './components/layout/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function LF() { return <LoadingScreen message="Loading..." />; }

export default function App() {
 return (
  <BrowserRouter>
   <AuthProvider>
    <Suspense fallback={<LF />}>
     <Routes>
      <Route element={<AdminLayout />}>
       <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route element={<AuthLayout />}>
       <Route path="/login" element={<Login />} />
      </Route>
      <Route path="*" element={<div className="flex flex-col items-center justify-center min-h-screen gap-4"><h1 className="text-6xl font-bold">404</h1><p className="text-muted-foreground">Page not found</p><a href="/dashboard" className="text-primary hover:underline">Dashboard</a></div>} />
     </Routes>
    </Suspense>
    <Toaster position="top-right" />
   </AuthProvider>
  </BrowserRouter>
 );
}
