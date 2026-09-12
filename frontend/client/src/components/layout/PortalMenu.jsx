import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Icons } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import {
  CONTRIBUTOR_PORTALS,
  STAFF_PORTALS,
  portalLoginUrl,
} from "../../config/portals";

function PortalRow({ portal, onNavigate }) {
  const Icon = portal.icon;

  return (
    <a
      href={portalLoginUrl(portal)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className="group flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/60"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-foreground">
          {portal.name}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
          {portal.tagline}
        </span>
      </span>

      <Icons.externalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
    </a>
  );
}

function GroupLabel({ children }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </p>
  );
}

/**
 * Account / workspace switcher.
 *
 * Sits in the navbar's top-right action cluster (where "Join as Author" used
 * to be) and links out to the other LifeBookz portals plus account settings.
 */
export function PortalMenu() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Portals and account settings"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 text-muted-foreground shadow-xs transition-all duration-200 hover:border-primary/25 hover:text-primary active:scale-95 sm:h-10 sm:px-3"
      >
        <Icons.globe className="h-[18px] w-[18px]" />
        <span className="hidden text-xs font-semibold tracking-wide md:inline">
          Portals
        </span>
        <Icons.chevronDown
          className={`hidden h-3 w-3 transition-transform duration-200 md:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-border/80 bg-card p-1.5 shadow-xl backdrop-blur-xl"
          >
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  {Icons.settings && (
                    <Icons.settings className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>Settings</span>
                </button>

                <div className="my-1 border-t border-border/40" />
              </>
            )}

            <GroupLabel>Contribute</GroupLabel>
            {CONTRIBUTOR_PORTALS.map((portal) => (
              <PortalRow
                key={portal.id}
                portal={portal}
                onNavigate={() => setIsOpen(false)}
              />
            ))}

            <div className="my-1 border-t border-border/40" />

            <GroupLabel>Staff</GroupLabel>
            {STAFF_PORTALS.map((portal) => (
              <PortalRow
                key={portal.id}
                portal={portal}
                onNavigate={() => setIsOpen(false)}
              />
            ))}

            <p className="px-3 pb-1 pt-2 text-[10px] leading-relaxed text-muted-foreground/80">
              Every portal opens in a new tab with its own sign-in.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PortalMenu;
