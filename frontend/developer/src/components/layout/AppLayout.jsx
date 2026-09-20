import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../../icons';
import Button from '../ui/Button';

function Brand() {
  return (
    <Link
      to="/logs"
      className="flex shrink-0 items-center gap-3"
      aria-label="LifeBookz — Developer Portal"
    >
      {/* The logo lockup already spells out "LifeBookz" — no text needed. */}
      <img
        src="/logo.png"
        alt="LifeBookz"
        className="h-10 w-auto shrink-0 sm:h-11"
      />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
        Developer
      </span>
    </Link>
  );
}

export default function AppLayout() {
  const { developer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <Icons.terminal className="h-3.5 w-3.5" />
              {developer?.email}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              icon={<Icons.logout className="h-3.5 w-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="LifeBookz"
              className="h-10 w-auto shrink-0"
            />
            <span className="text-xs text-muted-foreground">
              Developer Portal
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Outlet />
      </main>
    </div>
  );
}
