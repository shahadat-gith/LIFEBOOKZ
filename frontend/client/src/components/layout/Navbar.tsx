import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../../icons';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useState } from 'react';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Home', icon: <Icons.home className="h-4 w-4" /> },
    { to: '/stories', label: 'Stories', icon: <Icons.book className="h-4 w-4" /> },
    { to: '/search', label: 'Search', icon: <Icons.search className="h-4 w-4" /> },
  ];

  const displayName = user?.name || '';
  const avatarUrl = user?.avatar;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Lifebookz" className="h-9 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {link.icon}{link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                <Avatar src={avatarUrl} name={displayName} size="sm" />
                <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{displayName}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
                <Link to="/register"><Button variant="primary" size="sm">Sign Up</Button></Link>
              </div>
            )}
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Toggle menu">
            {mobileMenuOpen ? <Icons.close className="h-6 w-6" /> : <Icons.menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {link.icon}{link.label}
              </Link>
            ))}
            <hr className="border-border my-2" />
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Icons.user className="h-4 w-4" />Profile
                </Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
                  <Icons.logout className="h-4 w-4" />Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Icons.login className="h-4 w-4" />Log In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Icons.userAdd className="h-4 w-4" />Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
export default Navbar;
