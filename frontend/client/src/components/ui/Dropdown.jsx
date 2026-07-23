import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function DropdownItem({
  children,
  onClick,
  className = "",
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all text-left ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownMenu({ trigger, children, align = "right" }) {
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
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => setIsOpen(false)}
            className={`absolute z-50 mt-2 w-48 rounded-xl bg-card border border-border/80 shadow-lg p-1.5 backdrop-blur-xl ${
              align === "right"
                ? "right-0 origin-top-right"
                : "left-0 origin-top-left"
            }`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DropdownMenu;
