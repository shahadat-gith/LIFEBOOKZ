import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";

/**
 * Mobile-only bottom tab bar:
 *  Home · Discover · (+) · My Lifebook · Profile
 * The center + button is a floating primary action that starts the
 * story-writing wizard.
 */
export default function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { author } = useAuth();

  const isWriteActive = location.pathname.startsWith("/stories");

  const tabClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium transition-colors ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border/60 bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative flex items-end justify-around max-w-md mx-auto px-2">
        <NavLink to="/" end className={tabClass} aria-label="Home">
          <Icons.home className="h-5 w-5" />
          Home
        </NavLink>

        <NavLink to="/discover" className={tabClass} aria-label="Discover">
          <Icons.search className="h-5 w-5" />
          Discover
        </NavLink>

        {/* Floating center action */}
        <button
          type="button"
          onClick={() => navigate("/stories/new")}
          aria-label="Write a new story"
          className={`relative -top-4 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all active:scale-95 ${
            isWriteActive
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <Icons.plus className="h-7 w-7" />
        </button>

        <NavLink to="/my-lifebook" className={tabClass} aria-label="My Lifebook">
          <Icons.book className="h-5 w-5" />
          My Lifebook
        </NavLink>

        <NavLink to="/profile" className={tabClass} aria-label="Profile">
          <Icons.user className="h-5 w-5" />
          Profile
        </NavLink>
      </div>
    </nav>
  );
}
