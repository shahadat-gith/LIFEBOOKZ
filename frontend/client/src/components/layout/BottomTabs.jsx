import { Link, useLocation } from "react-router-dom";
import { tabs } from "./utils";

/** Is this tab the current one (or a parent of it)? */
function isActive(pathname, to) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

/**
 * One tab. Inactive tabs are a plain circle; the active one grows into a pill
 * with a filled icon chip and its label. The label is always rendered — its
 * max-width animates — so the pill expands smoothly instead of snapping.
 */
function Tab({ tab, active }) {
  const Icon = tab.icon;

  return (
    <Link
      to={tab.to}
      className={`flex h-11 min-w-0 items-center rounded-full p-1 transition-all duration-300 tap-highlight-transparent active:scale-95 ${
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
        <Icon className="h-[18px] w-[18px] stroke-[2.2]" />
      </span>

      {/* min-w-0 + truncate so a long label clips with an ellipsis on narrow
          phones instead of pushing the bar wider than the screen. */}
      <span
        className={`min-w-0 overflow-hidden transition-all duration-300 ${
          active ? "max-w-[7rem] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        <span className="block truncate pl-2 pr-3 text-xs font-semibold">
          {tab.label}
        </span>
      </span>
    </Link>
  );
}

/**
 * Mobile-only reader navigation — a floating pill that sits above the page:
 *
 *  (Home) (Feed) (Trending) (Profile)
 *
 * The current tab expands into a navy pill; the rest stay as quiet circles.
 */
export default function BottomTabs() {
  const location = useLocation();

  return (
    <>
      <div className="h-24 md:hidden" />

      <nav
        className="fixed inset-x-3 bottom-3 z-50 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-md select-none items-center justify-evenly gap-1 rounded-full border border-border/70 bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
          {tabs.map((tab) => (
            <Tab
              key={tab.to}
              tab={tab}
              active={isActive(location.pathname, tab.to)}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
