import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import { navLinks } from "./utils";
import Button from "../ui/Button";
import UserDropdown from "./UserDropdown";
import PortalMenu from "./PortalMenu";
import SearchModal from "./SearchModal";
import NotificationsDrawer from "./NotificationsDrawer";
import useNotifications from "../../hooks/useNotifications";
import api from "../../config/axios";

/**
 * Brand — the logo lockup already spells out "LifeBookz", so no text is
 * needed beside it. The subtle scale on hover keeps the link feeling alive.
 */
function BrandWordmark() {
  return (
    <Link
      to="/"
      className="group flex shrink-0 select-none items-center"
      aria-label="LifeBookz - Home"
    >
      <img
        src="/logo.png"
        alt="LifeBookz"
        className="h-10 w-auto transition-transform duration-200 group-hover:scale-[1.03] sm:h-11"
      />
    </Link>
  );
}

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { unread } = useNotifications(api, { enabled: isAuthenticated });

  const isActive = (path) => location.pathname === path;

  const iconButtonClass =
    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-xs transition-all duration-200 hover:border-primary/25 hover:text-primary active:scale-95 sm:h-10 sm:w-10";

  function openSearch() {
    setNotificationsOpen(false);
    setSearchOpen(true);
  }

  function openNotifications() {
    setSearchOpen(false);
    setNotificationsOpen(true);
  }

  return (
    <>
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
            {/* Search */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search stories"
              className={iconButtonClass}
            >
              <Icons.search className="h-[18px] w-[18px]" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              onClick={openNotifications}
              aria-label="Notifications"
              className={iconButtonClass}
            >
              <Icons.bell className="h-[18px] w-[18px]" />
              {isAuthenticated && unread > 0 && (
                <span className="absolute right-1.5 top-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accent ring-2 ring-background flex items-center justify-center text-[9px] font-bold text-white sm:right-2 sm:top-2">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {(!isAuthenticated || unread === 0) && (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-background sm:right-2.5 sm:top-2.5"
                />
              )}
            </button>

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

      {/* Overlays */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}

export default Navbar;
