import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileTabBar from './MobileTabBar';

export function AppLayout() {
 return (
  <div className="min-h-screen flex flex-col bg-background">
   <Navbar />
   <main className="flex-1 pb-24 md:pb-0">
    <Outlet />
   </main>
   <MobileTabBar />
  </div>
 );
}

// Auth pages render their own full-screen AuthShell layout (no navbar —
// the portal is login-first, so there is nothing to navigate to yet).
export function AuthLayout() {
 return (
  <div className="min-h-screen bg-background">
   <Outlet />
  </div>
 );
}

export function HomeLayout() {
 return (
  <div className="min-h-screen flex flex-col bg-background">
   <Navbar />
   <main className="flex-1">
    <Outlet />
   </main>
   <MobileTabBar />
  </div>
 );
}

export default AppLayout;
