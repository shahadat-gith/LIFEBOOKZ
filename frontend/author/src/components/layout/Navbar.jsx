import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import NotificationsDrawer from "./NotificationsDrawer";

export function Navbar() {
  const { author, isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);

  const isA = (p) => loc.pathname === p;

  // Only approved authors may create stories (the API enforces the same
  // rule), so pending and rejected applications never see the Write link.
  const canWrite = author?.verification?.status === "approved";

  const links = [
    { to: "/", label: "Home", icon: <Icons.home className="h-4 w-4" /> },
    { to: "/discover", label: "Discover", icon: <Icons.search className="h-4 w-4" /> },
    { to: "/my-lifebook", label: "My Lifebook", icon: <Icons.book className="h-4 w-4" /> },
    ...(canWrite
      ? [
          {
            to: "/stories/new",
            label: "Write",
            icon: <Icons.edit className="h-4 w-4" />,
          },
        ]
      : []),
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

  function submitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    navigate(`/discover?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-[4.5rem]">
          {/* Brand Logo + tagline */}
          <Link to={isAuthenticated ? "/home" : "/"} className="group flex flex-col">
            <span className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground leading-none">
              LIFEBOOK<span className="text-accent">Z</span>
            </span>
            <span className="hidden sm:block text-[11px] text-muted-foreground mt-0.5">
              The Story of My Life.
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
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
          )}

          {/* Right cluster: search + notifications + profile */}
          <div className="flex items-center gap-2">
            {/* Search (desktop inline, mobile icon) */}
            <form
              onSubmit={submitSearch}
              className="hidden lg:flex items-center rounded-xl border border-border/60 bg-card px-3 py-1.5 focus-within:border-primary/40 transition-colors"
            >
              <Icons.search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stories..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2 w-40 xl:w-52"
              />
            </form>

            <button
              type="button"
              onClick={() => (window.innerWidth < 1024 ? setSearchOpen((o) => !o) : document.querySelector("form input")?.focus())}
              aria-label="Search"
              className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors lg:hidden"
            >
              <Icons.search className="h-5 w-5" />
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Icons.bell className="h-5 w-5" />
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-background" />
              </button>
            )}

            {/* Desktop User Profile / Auth Area */}
            {isAuthenticated && author ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
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

                {/* Profile Dropdown — only items NOT in the bottom tabs */}
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
                          {author.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {author.email}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Icons.settings className="h-4 w-4 text-muted-foreground" />
                        Account Settings
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setNotifOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Icons.bell className="h-4 w-4 text-muted-foreground" />
                        Notifications
                      </button>

                      <hr className="my-1 border-border/50" />

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          navigate("/");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Icons.logout className="h-4 w-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Dummy notifications drawer (mock data for now) */}
        <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

        {/* Mobile search bar (toggled) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={submitSearch}
              className="overflow-hidden md:hidden"
            >
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 mb-3">
                <Icons.search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search stories..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-muted-foreground"
                >
                  <Icons.close className="h-4 w-4" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default Navbar;
