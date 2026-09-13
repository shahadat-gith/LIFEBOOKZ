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

export function AuthLayout() {
 return (
  <div className="min-h-screen flex flex-col bg-background">
   <Navbar />
   <main className="flex-1 flex items-center justify-center py-12 px-4">
    <Outlet />
   </main>
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
