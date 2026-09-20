import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Icons } from "../../icons";

const TABS = [
  { to: "/", end: true, label: "Home", Icon: Icons.home },
  { to: "/feed", label: "Feed", Icon: Icons.document },
  { to: "/my-stories", label: "My Stories", Icon: Icons.book },
  { to: "/profile", label: "Profile", Icon: Icons.user },
];

/** A tab is active on its own route and anywhere beneath it. */
function isActive(pathname, tab) {
  return tab.end ? pathname === tab.to : pathname.startsWith(tab.to);
}


function Tab({ tab, active }) {
  const { Icon } = tab;

  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={`flex h-11 min-w-0 items-center rounded-full p-1 transition-all duration-300 active:scale-95 ${
        active
          ? "bg-primary/8 text-primary"
          : "shrink-0 justify-center bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
          active ? "bg-primary text-primary-foreground shadow-sm" : ""
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      {/* min-w-0 + truncate so a long label clips with an ellipsis on very
          narrow phones instead of pushing the bar wider than the screen. */}
      <span
        className={`min-w-0 overflow-hidden transition-all duration-300 ${
          active ? "max-w-[7rem] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        <span className="block truncate pl-2 pr-3 text-xs font-semibold">
          {tab.label}
        </span>
      </span>
    </NavLink>
  );
}


export default function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isWriteActive = location.pathname.startsWith("/stories");

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="relative mx-auto max-w-md">
 
        <div className="flex items-center justify-evenly gap-1 rounded-full border border-border/70 bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
          {TABS.map((tab) => (
            <Tab
              key={tab.to}
              tab={tab}
              active={isActive(location.pathname, tab)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
