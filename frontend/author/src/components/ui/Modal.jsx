import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "../../icons";

/**
 * The portal's modal dialog.
 *
 * A bottom sheet on phones and a centred panel from `sm` up. Rendered through
 * a portal so it stacks above the sticky bars, and page scroll is locked (and
 * Escape closes) while it is open.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-lg",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — clicking it closes the modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[9998] bg-primary/40 backdrop-blur-sm"
          />

          {/* The dialog sits in a click-through layer so the backdrop above
              still receives clicks anywhere outside the panel. */}
          <div className="pointer-events-none fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
              className={`pointer-events-auto flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl border border-border/70 bg-card shadow-2xl sm:rounded-2xl`}
            >
              {(title || subtitle) && (
                <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
                  <div className="min-w-0">
                    {title && (
                      <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icons.close className="h-5 w-5" />
                  </button>
                </header>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

              {footer && (
                <footer className="border-t border-border/60 px-5 py-3.5">
                  {footer}
                </footer>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
