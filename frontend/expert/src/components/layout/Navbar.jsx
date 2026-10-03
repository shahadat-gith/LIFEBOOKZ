import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

export function Navbar() {
  const { expert, isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isA = (p) => loc.pathname === p;

  // Navigation lives in the profile dropdown, like the author portal — the
  // navbar itself stays quiet: brand on the left, account on the right.
  const links = [
    { to: "/", label: "Home", icon: Icons.home },
    { to: "/dashboard", label: "Dashboard", icon: Icons.dashboard },
    { to: "/profile", label: "Profile", icon: Icons.user },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-[4.5rem]">
          {/* Brand — logo plus the two-tone wordmark from the theme token */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="LifeBookz — Home"
          >
            <img
              src="/logo.png"
              alt="LifeBookz"
              className="h-9 w-auto shrink-0 transition-transform duration-200 group-hover:scale-[1.03] sm:h-10"
            />
            <span className="font-display text-xl font-bold tracking-tight text-brand-wordmark">
              Life<span className="text-accent">bookz</span>
            </span>
          </Link>

          {/* Right cluster: profile */}
          <div className="flex items-center gap-2">

            {isAuthenticated && expert ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-1.5 hover:border-border/60 hover:bg-card/80 transition-all duration-200 focus:outline-none"
                >
                  <Avatar
                    src={expert.avatar?.url}
                    name={expert.fullName}
                    size="sm"
                    className="ring-2 ring-border/80"
                  />
                  <Icons.chevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-border/80 bg-popover p-1.5 shadow-md shadow-black/5"
                    >
                      <div className="border-b border-border/50 px-3 py-2.5 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          {expert.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {expert.email}
                        </p>
                      </div>

                      {/* Navigation items (moved out of the navbar) */}
                      <div className="pb-1 mb-1 border-b border-border/50">
                        {links.map((l) => {
                          const Icon = l.icon;
                          return (
                            <Link
                              key={l.to}
                              to={l.to}
                              onClick={() => setProfileOpen(false)}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                isA(l.to)
                                  ? "bg-primary/5 text-primary"
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {l.label}
                            </Link>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
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
        </div>
      </div>
    </header>
  );
}

export default Navbar;
