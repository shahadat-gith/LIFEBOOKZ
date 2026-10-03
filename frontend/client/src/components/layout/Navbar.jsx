import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { navLinks } from "./navigation";
import Button from "../ui/Button";
import UserDropdown from "./UserDropdown";
import PortalMenu from "./PortalMenu";

/**
 * Brand — logo plus the two-tone wordmark: white "Life", coral "bookz".
 * Lives on the navy header bar, so the white half reads clearly.
 */
function BrandWordmark() {
  return (
    <Link
      to="/"
      className="group flex shrink-0 select-none items-center gap-2.5"
      aria-label="LifeBookz - Home"
    >
      <img
        src="/logo.png"
        alt="LifeBookz"
        className="h-9 w-auto transition-transform duration-200 group-hover:scale-[1.03] sm:h-10"
      />
      <span className="font-display text-xl font-bold tracking-tight text-brand-wordmark">
        Life<span className="text-accent">bookz</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand wordmark */}
          <BrandWordmark />

          {/* Center Links - Hidden on smaller screens (< 768px) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 ${
                    active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-primary via-primary to-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Corner Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Portals + account settings */}
            <PortalMenu />

            {/* User Account / Login */}
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <Link to="/login" className="ml-0.5">
                <Button
                  variant="primary"
                  size="sm"
                  className="font-bold text-xs rounded-full px-4"
                >
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
    </header>
  );
}

export default Navbar;
