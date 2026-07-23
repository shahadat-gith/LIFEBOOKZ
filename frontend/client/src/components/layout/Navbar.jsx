import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Home", icon: <Icons.home className="h-4 w-4" /> },
    { to: "/feed", label: "Feed", icon: <Icons.document className="h-4 w-4" /> },
    { to: "/authors", label: "Authors", icon: <Icons.user className="h-4 w-4" /> },
    { to: "/trending", label: "Trending", icon: <Icons.sparkles className="h-4 w-4" /> },
  ];

  const handleSearch = () => {
    const q = search.trim();
    if (!q) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 border-b border-accent-foreground/20 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 shadow-[0_2px_20px_-12px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img src="/logo.png" alt="Lifebookz" className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02]" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 ml-8">
          {navLinks.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-all duration-200 ${
                  active
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-primary via-primary to-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search stories, authors..."
                className="w-full h-10 rounded-full border border-border/60 bg-muted/20 backdrop-blur-md pl-5 pr-24 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-300 focus:border-primary/50 focus:bg-background focus:shadow-[0_0_15px_-3px_rgba(0,0,0,0.05)]"
              />

              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="h-7 px-3.5 rounded-full text-xs font-semibold tracking-wide bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                  aria-label="Submit Search"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (Desktop) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <Link to="/profile">
              <Avatar src={user?.avatar?.url} name={user?.fullName} size="sm" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="primary" size="sm" className="font-medium text-muted-foreground">
                  Log In
                </Button>
              </Link>
             
            </div>
          )}
        </div>

        {/* Mobile Actions Block */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => navigate("/search")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
            aria-label="Open search page"
          >
            <Icons.search className="h-5 w-5 text-muted-foreground" />
          </button>

          {isAuthenticated ? (
            <Link to="/profile">
              <Avatar src={user?.avatar?.url || "/user.png"} name={user?.fullName} size="sm" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
              aria-label="Log in"
            >
              <Icons.user className="h-5 w-5 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
