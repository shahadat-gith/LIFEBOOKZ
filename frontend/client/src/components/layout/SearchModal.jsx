import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../icons";

const SUGGESTED_SEARCHES = [
  "a mother's sacrifice",
  "small town dreams",
  "starting over",
  "healing and hope",
  "lessons from failure",
];

export default function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    setQuery("");

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function runSearch(term) {
    const q = (term ?? query).trim();
    onClose();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/20 ring-1 ring-border/60"
          >
            {/* Search input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5"
            >
              <Icons.search className="h-5 w-5 shrink-0 text-muted-foreground" />

              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stories by meaning or title..."
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icons.close className="h-4 w-4" />
                </button>
              )}

              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all hover:brightness-110"
              >
                Search
              </button>
            </form>

            {/* Suggestions */}
            <div className="p-4 sm:p-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Try searching
              </p>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => runSearch(term)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3.5 py-2 text-xs font-semibold text-foreground/80 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    <Icons.sparkles className="h-3 w-3 text-accent" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
