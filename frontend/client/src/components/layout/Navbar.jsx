import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import UserDropdown from "./UserDropdown";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/feed", label: "Feed" },
    { to: "/authors", label: "Authors" },
    { to: "/trending", label: "Trending" },
  ];

  // Configured Array of User Options
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
    <header className="sticky top-0 z-50 w-full transition-all duration-300 border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img
            src="/logo.png"
            alt="Lifebookz"
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>

        {/* Center Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
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

        {/* User Account Corner */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <UserDropdown
              user={user}
              items={dropdownItems}
              onLogout={handleLogout}
            />
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm" className="font-semibold text-xs rounded-xl px-4">
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