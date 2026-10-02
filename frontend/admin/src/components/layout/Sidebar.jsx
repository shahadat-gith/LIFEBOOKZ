import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../../icons';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Icons.home },
  { path: '/dashboard/authors', label: 'Authors', icon: Icons.faUserTie, badgeKey: 'authors' },
  { path: '/dashboard/experts', label: 'Experts', icon: Icons.faUserGraduate, badgeKey: 'experts' },
  { path: '/dashboard/stories', label: 'Stories', icon: Icons.faBookOpen },
  { path: '/dashboard/users', label: 'Users', icon: Icons.faUsers },
];

export default function Sidebar({ pendingCount = 0, pendingExperts = 0, collapsed = false, onToggleCollapse }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const sidebarClasses = collapsed ? 'w-[72px]' : 'w-64';

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-primary/45 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <Icons.close className="h-5 w-5" /> : <Icons.menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border lg:hidden flex flex-col"
          >
            <SidebarContent
              collapsed={false}
              onToggle={() => {}}
              pendingCount={pendingCount}
              pendingExperts={pendingExperts}
              onNavClick={handleNavClick}
              logout={logout}
              location={location}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-card border-r border-border transition-all duration-300 ease-in-out ${sidebarClasses}`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={onToggleCollapse}
          pendingCount={pendingCount}
          pendingExperts={pendingExperts}
          onNavClick={handleNavClick}
          logout={logout}
          location={location}
        />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed, onToggle, pendingCount, pendingExperts, onNavClick, logout, location }) {
  const badgeCounts = { authors: pendingCount, experts: pendingExperts };

  return (
    <>
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-border px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/logo.png"
            alt="LifeBookz"
            className="h-9 w-auto flex-shrink-0"
          />
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight text-brand-wordmark">
              Life<span className="text-accent">bookz</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badgeKey && badgeCounts[item.badgeKey] > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                  {badgeCounts[item.badgeKey] > 9 ? '9+' : badgeCounts[item.badgeKey]}
                </span>
              )}
              {collapsed && item.badgeKey && badgeCounts[item.badgeKey] > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  {badgeCounts[item.badgeKey] > 9 ? '9+' : badgeCounts[item.badgeKey]}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        {/* Collapse toggle - desktop only */}
        <button
          onClick={onToggle}
          className={`hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Icons.chevronRight className="h-5 w-5" />
          ) : (
            <>
              <Icons.chevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          title="Sign Out"
        >
          <Icons.logout className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );
}
