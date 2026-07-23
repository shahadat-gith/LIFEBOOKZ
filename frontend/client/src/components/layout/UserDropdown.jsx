import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";

export default function UserDropdown({ user, items, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-muted/50 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <Avatar
          src={user?.avatar?.url}
          name={user?.fullName || "User"}
          size="sm"
          className="ring-1 ring-border/60"
        />
        {Icons?.chevronDown && (
          <Icons.chevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block ${
              isOpen ? "rotate-180 text-foreground" : ""
            }`}
          />
        )}
      </button>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-52 rounded-2xl bg-card border border-border/80 shadow-xl p-1.5 backdrop-blur-xl"
          >
            {/* User Info Header */}
            <div className="px-3 py-2.5 border-b border-border/40 mb-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {user?.email || "member@community.com"}
              </p>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors text-left"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="my-1 border-t border-border/40" />

            {/* Logout Action */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              {Icons?.logout && <Icons.logout className="h-3.5 w-3.5" />}
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}