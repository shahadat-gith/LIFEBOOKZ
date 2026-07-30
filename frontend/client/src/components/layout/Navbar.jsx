import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import { navLinks } from "./utils";
import Button from "../ui/Button";
import UserDropdown from "./UserDropdown";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const authorPortal = import.meta.env.VITE_AUTHOR_PORTAL || "#";

  const isActive = (path) => location.pathname === path;

  const dropdownItems = [
    {
      label: "Profile",
      icon: Icons?.user && <Icons.user className="h-3.5 w-3.5 text-muted-foreground" />,
      onClick: () => navigate("/profile"),
    },
    {
      label: "Preferences",
      icon: Icons?.sparkles && <Icons.sparkles className="h-3.5 w-3.5 text-muted-foreground" />,
      onClick: () => navigate("/preferences"),
    },
    {
      label: "Settings",
      icon: Icons?.cog ? (
        <Icons.cog className="h-3.5 w-3.5 text-muted-foreground" />
      ) : Icons?.document ? (
        <Icons.document className="h-3.5 w-3.5 text-muted-foreground" />
      ) : null,
      onClick: () => navigate("/settings"),
    },
  ];

  const handleLogout = () => {
    if (logout) logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img
            src="/logo.png"
            alt="Lifebookz"
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>

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

        {/* Right Corner: Always Visible Actions (Author Join + Profile/Login) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Join as Author Button */}
          <a
            href={`${authorPortal}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent/15 text-accent border border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-xs active:scale-[0.98]"
          >
          
            <span>Join as Author</span>
          </a>

          {/* User Account / Login */}
          {isAuthenticated ? (
            <UserDropdown
              user={user}
              items={dropdownItems}
              onLogout={handleLogout}
            />
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm" className="font-semibold text-xs rounded-xl px-3.5 sm:px-4">
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