import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { Icons } from '../../icons';

export default function AdminLayout() {
 const { isAuthenticated, logout } = useAuth();
 return <div className="min-h-screen flex flex-col bg-background">
  <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
   <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <Link to="/dashboard" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"><Icons.shieldCheck className="h-4 w-4 text-white" /></div><span className="text-sm font-semibold text-foreground">LifeBookz</span><span className="text-xs text-muted-foreground">Admin</span></Link>
    {isAuthenticated && <Button variant="ghost" size="sm" onClick={logout} icon={<Icons.logout className="h-4 w-4" />}>Sign Out</Button>}
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
