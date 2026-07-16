import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { Icons } from '../../icons';

export default function AdminLayout() {
  const { admin, isAuthenticated, logout } = useAuth();
  return <div className="min-h-screen flex flex-col bg-background">
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2"><img src="/logo.png" alt="L" className="h-9 w-auto" /><span className="text-sm font-semibold text-muted-foreground">Admin Portal</span></Link>
        {isAuthenticated && admin && <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{admin.email}</span><Button variant="ghost" size="sm" onClick={logout}><Icons.logout className="h-4 w-4" /></Button></div>}
      </div>
    </header>
    <main className="flex-1"><Outlet /></main>
  </div>;
}

export function AuthLayout() {
  return <div className="min-h-screen flex flex-col bg-background">
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center"><Link to="/login" className="flex items-center gap-2"><img src="/logo.png" alt="L" className="h-9 w-auto" /><span className="text-sm font-semibold text-muted-foreground">Admin Portal</span></Link></div>
    </header>
    <main className="flex-1 flex items-center justify-center py-12 px-4"><Outlet /></main>
  </div>;
}
