import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../icons';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useState } from 'react';

export function Navbar() {
 const { author, isAuthenticated, logout } = useAuth();
 const loc = useLocation();
 const [mobile, setMobile] = useState(false);
 const [profileOpen, setProfileOpen] = useState(false);
 const isA = (p) => loc.pathname === p;

 const links = [
  { to: '/', label: 'Home', icon: <Icons.home className="h-4 w-4" /> },
  { to: '/dashboard', label: 'Dashboard', icon: <Icons.dashboard className="h-4 w-4" /> },
  { to: '/stories/new', label: 'Write', icon: <Icons.edit className="h-4 w-4" /> },
 ];

 const isHome = loc.pathname === '/';

 return (
  <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16 md:h-20">
     {/* Logo */}
     <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300">
       <Icons.book className="h-5 w-5 text-white" />
      </div>
      <div className="hidden sm:block">
       <span className="text-base font-bold">LifeBookz</span>
       <span className="text-xs text-muted-foreground ml-2 font-medium">Author</span>
      </div>
     </Link>

     {/* Desktop Nav */}
     <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
      {links.map(l => (
       <Link
        key={l.to}
        to={l.to}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
         isA(l.to)
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }`}
       >
        {l.icon}
        {l.label}
       </Link>
      ))}
     </nav>

     {/* Desktop Right */}
     <div className="hidden md:flex items-center gap-3">
      {isAuthenticated && author ? (
       <div className="relative">
        <button
         onClick={() => setProfileOpen(!profileOpen)}
         className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/80 transition-all duration-200"
        >
         <Avatar src={author.avatar?.url} name={author.fullName} size="sm" className="ring-2 ring-primary/20" />
         <div className="text-left">
          <p className="text-sm font-medium text-foreground leading-tight">{author.fullName}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{author.profession}</p>
         </div>
         <Icons.chevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
         {profileOpen && (
          <motion.div
           initial={{ opacity: 0, y: -8, scale: 0.96 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -8, scale: 0.96 }}
           transition={{ duration: 0.15 }}
           className="absolute right-0 top-full mt-2 w-56 p-2 rounded-xl bg-popover border border-border shadow-xl shadow-black/5"
          >
           <div className="px-3 py-2 mb-1 border-b border-border/50">
            <p className="text-sm font-medium text-foreground">{author.fullName}</p>
            <p className="text-xs text-muted-foreground">{author.email}</p>
           </div>
           <Link
            to="/dashboard"
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
           >
            <Icons.home className="h-4 w-4" /> Dashboard
           </Link>
           <Link
            to="/profile"
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
           >
            <Icons.user className="h-4 w-4" /> Profile
           </Link>
           <hr className="my-1 border-border/50" />
           <button
            onClick={() => { logout(); setProfileOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
           >
            <Icons.logout className="h-4 w-4" /> Sign Out
           </button>
          </motion.div>
         )}
        </AnimatePresence>
       </div>
      ) : (
       <div className="flex items-center gap-2">
        <Link to="/login">
         <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
        {!isHome && (
         <Link to="/register">
          <Button size="sm" className="shadow-sm">Get Started</Button>
         </Link>
        )}
       </div>
      )}
     </div>

     {/* Mobile Hamburger */}
     <button
      onClick={() => setMobile(!mobile)}
      className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
     >
      <div className="flex flex-col gap-1.5">
       <motion.span
        animate={mobile ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        className="block w-5 h-0.5 bg-foreground rounded-full transition-all"
       />
       <motion.span
        animate={mobile ? { opacity: 0 } : { opacity: 1 }}
        className="block w-5 h-0.5 bg-foreground rounded-full"
       />
       <motion.span
        animate={mobile ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        className="block w-5 h-0.5 bg-foreground rounded-full transition-all"
       />
      </div>
     </button>
    </div>
   </div>

   {/* Mobile Menu */}
   <AnimatePresence>
    {mobile && (
     <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="md:hidden overflow-hidden border-t border-border/50 bg-card/95 backdrop-blur-xl"
     >
      <div className="px-4 py-3 space-y-1">
       {links.map(l => (
        <Link
         key={l.to}
         to={l.to}
         onClick={() => setMobile(false)}
         className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isA(l.to)
           ? 'bg-primary/10 text-primary'
           : 'text-muted-foreground hover:text-foreground hover:bg-muted'
         }`}
        >
         {l.icon}
         {l.label}
        </Link>
       ))}

       <hr className="border-border/50 my-2" />

       {isAuthenticated && author ? (
        <>
         <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar src={author.avatar?.url} name={author.fullName} size="sm" />
          <div>
           <p className="text-sm font-medium text-foreground">{author.fullName}</p>
           <p className="text-xs text-muted-foreground">{author.email}</p>
          </div>
         </div>
         <Link
          to="/profile"
          onClick={() => setMobile(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
         >
          <Icons.user className="h-4 w-4" /> Profile
         </Link>
         <button
          onClick={() => { logout(); setMobile(false); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10"
         >
          <Icons.logout className="h-4 w-4" /> Sign Out
         </button>
        </>
       ) : (
        <div className="flex flex-col gap-2 pt-2">
         <Link to="/login" onClick={() => setMobile(false)}>
          <Button variant="outline" fullWidth size="sm">Sign In</Button>
         </Link>
         <Link to="/register" onClick={() => setMobile(false)}>
          <Button fullWidth size="sm">Get Started</Button>
         </Link>
        </div>
       )}
      </div>
     </motion.div>
    )}
   </AnimatePresence>
  </header>
 );
}

export default Navbar;
