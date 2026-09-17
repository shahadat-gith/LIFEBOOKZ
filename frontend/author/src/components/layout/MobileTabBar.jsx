import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Icons } from "../../icons";

const TABS = [
  { to: "/", end: true, label: "Home", Icon: Icons.home },
  { to: "/feed", label: "Feed", Icon: Icons.document },
  { to: "/my-lifebook", label: "My Lifebook", Icon: Icons.book },
  { to: "/profile", label: "Profile", Icon: Icons.user },
];

/**
 * Mobile-only bottom tab bar:
 *  Home · Feed · (+) · My Lifebook · Profile
 * Built on a strict 5-column grid so the center + button sits exactly
 * in the middle; it floats above the bar as the primary write action.
 */
export default function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isWriteActive = location.pathname.startsWith("/stories");

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border/60 bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* 5 equal columns: tab, tab, [notch], tab, tab */}
      <div className="relative grid grid-cols-5 max-w-md mx-auto h-16">
        {TABS.slice(0, 2).map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={linkClass}>
            <t.Icon className="h-5 w-5" />
            {t.label}
          </NavLink>
        ))}

        {/* Center notch — reserved column keeps the + perfectly centered */}
        <div className="relative flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/stories/new")}
            aria-label="Write a new story"
            className={`absolute left-1/2 -translate-x-1/2 -top-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg ring-4 ring-card transition-all active:scale-95 ${
              isWriteActive
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            <Icons.plus className="h-7 w-7" />
          </button>
        </div>

        {TABS.slice(2).map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={linkClass}>
            <t.Icon className="h-5 w-5" />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
