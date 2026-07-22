import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../../icons';
import Badge from '../ui/Badge';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Icons.home },
  { path: '/dashboard/authors', label: 'Authors', icon: Icons.faUserTie },
  { path: '/dashboard/stories', label: 'Stories', icon: Icons.faBookOpen },
  { path: '/dashboard/users', label: 'Users', icon: Icons.faUsers },
];

export default function Sidebar({ pendingCount = 0, collapsed = false, onToggleCollapse }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const sidebarClasses = collapsed
    ? 'w-[72px]'
    : 'w-64';

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse();
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border shadow-md text-foreground hover:bg-muted transition-all"
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
          onToggle={handleToggle}
          pendingCount={pendingCount}
          onNavClick={handleNavClick}
          logout={logout}
          location={location}
        />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed, onToggle, pendingCount, onNavClick, logout, location }) {
  return (
    <>
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-border px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/logo.png"
            alt="LifeBookz"
            className="h-8 w-8 rounded-lg flex-shrink-0"
          />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-sm font-bold text-foreground tracking-tight block leading-tight">LifeBookz</span>
              <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">Admin Portal</span>
            </motion.div>
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
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="flex-shrink-0">
                <Icon className={`h-5 w-5 ${isActive ? 'text-accent' : ''}`} />
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.label === 'Authors' && pendingCount > 0 && (
                <Badge variant="warning" className="ml-auto">
                  {pendingCount}
                </Badge>
              )}
              {collapsed && item.label === 'Authors' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-warning-foreground">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute inset-0 rounded-xl bg-accent/5 ${collapsed ? '' : ''}`}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  style={{ zIndex: -1 }}
                />
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
          className={`hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border ${collapsed ? 'justify-center' : ''}`}
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
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 border border-transparent hover:border-destructive/20 ${collapsed ? 'justify-center' : ''}`}
          title="Sign Out"
        >
          <Icons.logout className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );
}

