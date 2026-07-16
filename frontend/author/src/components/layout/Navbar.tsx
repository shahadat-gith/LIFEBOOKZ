import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../../icons';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useState } from 'react';

export function Navbar() {
  const { author, isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const [mobile, setMobile] = useState(false);
  const isA = (p: string) => loc.pathname === p;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <Icons.home className="h-4 w-4" /> },
    { to: '/stories/new', label: 'Write', icon: <Icons.edit className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Lifebookz" className="h-9 w-auto object-contain" />
            <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">Author Portal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isA(l.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {l.icon}{l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && author ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <Avatar src={author.avatar} name={author.fullName} size="sm" />
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{author.fullName}</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} icon={<Icons.logout className="h-4 w-4" />}>Logout</Button>
              </>
            ) : (
              <Link to="/login"><Button variant="primary" size="sm">Sign In</Button></Link>
            )}
          </div>

          <button onClick={() => setMobile(!mobile)} className="md:hidden p-2 rounded-lg text-muted-foreground">
            {mobile ? <Icons.close className="h-6 w-6" /> : <Icons.menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobile && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobile(false)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isA(l.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              {l.icon}{l.label}
            </Link>
          ))}
          <hr className="border-border my-2" />
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMobile(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                <Icons.user className="h-4 w-4" />Profile
              </Link>
              <button onClick={() => { logout(); setMobile(false); }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
                <Icons.logout className="h-4 w-4" />Log Out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobile(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
              <Icons.login className="h-4 w-4" />Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
