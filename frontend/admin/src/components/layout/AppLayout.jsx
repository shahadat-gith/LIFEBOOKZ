import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Spinner from '../ui/Spinner';
import { adminApi } from '../../utils/client';

export default function AdminLayout() {
  const { isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    adminApi.getDashboard()
      .then((res) => {
        setPendingCount(res.data.data.pendingAuthors || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        pendingCount={pendingCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center justify-center h-16 px-4 ml-14">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="LifeBookz" className="h-7 w-7 rounded-lg" />
              <span className="text-sm font-bold text-foreground">LifeBookz</span>
              <span className="text-[10px] text-accent font-semibold uppercase tracking-wider ml-1">Admin</span>
            </Link>
          </div>
        </div>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="min-h-[calc(100vh-4rem)] lg:min-h-screen"
        >
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Spinner size="lg" label="Loading..." />
            </div>
          ) : (
            <Outlet />
          )}
        </motion.main>
      </div>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link to="/login" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="LifeBookz" className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-semibold text-foreground">LifeBookz</span>
            <span className="text-xs text-muted-foreground ml-1.5">Admin Portal</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Outlet />
      </main>
    </div>
  );
}
