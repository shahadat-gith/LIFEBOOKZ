import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

export function Navbar() {
  const { author, isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const [mobile, setMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isA = (p) => loc.pathname === p;

  const links = [
    { to: "/", label: "Home", icon: <Icons.home className="h-4 w-4" /> },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <Icons.dashboard className="h-4 w-4" />,
    },
    {
      to: "/stories/new",
      label: "Write",
      icon: <Icons.edit className="h-4 w-4" />,
    },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Brand Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card p-1.5 border border-border/80 shadow-2xs transition-all duration-300 group-hover:border-border">
              <img
                src="/logo.png"
                alt="LifeBookz logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-base font-semibold tracking-tight text-foreground">
                {author?.fullName || "LifeBookz"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 rounded-xl bg-muted/60 p-1 md:flex border border-border/40">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                  isA(l.to)
                    ? "bg-background text-foreground shadow-2xs border border-border/50"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                }`}
              >
                {l.icon}
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop User Profile / Auth Area */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && author ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-1.5 hover:border-border/60 hover:bg-card/80 transition-all duration-200 focus:outline-none"
                >
                  <Avatar
                    src={author.avatar?.url}
                    name={author.fullName}
                    size="sm"
                    className="ring-2 ring-border/80"
                  />
                  
                  <Icons.chevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/80 bg-popover p-1.5 shadow-md shadow-black/5"
                    >
                      <div className="border-b border-border/50 px-3 py-2 mb-1">
                        <p className="text-xs font-semibold text-foreground">
                          {author.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {author.email}
                        </p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Icons.dashboard className="h-4 w-4" /> Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Icons.user className="h-4 w-4" /> Profile
                      </Link>

                      <hr className="my-1 border-border/50" />

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
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
                  <Button size="sm">Sign In</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <Link to="/profile">
                <Avatar
                  src={author?.avatar?.url}
                  name={author?.fullName}
                  size="sm"
                  className="ring-1 ring-border"
                />
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors"
              >
                <Icons.user className="h-5 w-5" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobile(!mobile)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              {mobile ? (
                <Icons.close className="h-5 w-5" />
              ) : (
                <Icons.menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-border/50 md:hidden"
            >
              <div className="space-y-1 py-3">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobile(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isA(l.to)
                        ? "bg-accent text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    {l.icon} {l.label}
                  </Link>
                ))}
                {isAuthenticated && (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobile(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                    >
                      <Icons.user className="h-4 w-4" /> Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobile(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Icons.logout className="h-4 w-4" /> Sign Out
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default Navbar;