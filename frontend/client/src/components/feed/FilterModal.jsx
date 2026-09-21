import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "../../icons";
import { GENDER_OPTIONS, activeFilterCount } from "../../utils/feedFilters";

const fieldCls =
  "w-full cursor-pointer appearance-none rounded-xl border border-border/60 bg-background py-2.5 pl-11 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

/** One labelled row of the modal. */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * The feed's filters, behind the filter icon.
 *
 * Nothing is requested until "Show results" is pressed: the reader edits a
 * draft, so changing three controls costs one request instead of three — and
 * typing an author's name no longer needs an Enter key to apply it.
 */
export default function FilterModal({
  open,
  onClose,
  draft,
  professions = [],
  professionsLoading = false,
  canFilterFollowing = false,
  onChange,
  onClear,
  onApply,
}) {
  const count = activeFilterCount(draft);

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
          />

          {/* Panel — a bottom sheet on phones, a centred dialog from sm up */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filter stories"
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl ring-1 ring-border/60 sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
                  Filter stories
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Narrow the feed to the stories you want to read.
                </p>
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

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {/* Author name */}
              <Field label="Author name">
                <div className="relative">
                  <Icons.user className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={draft.authorName}
                    onChange={(e) => onChange("authorName", e.target.value)}
                    placeholder="Enter author name"
                    aria-label="Filter by author name"
                    className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-11 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {draft.authorName && (
                    <button
                      type="button"
                      onClick={() => onChange("authorName", "")}
                      aria-label="Clear author name"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <Icons.close className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Field>

              {/* Profession */}
              <Field label="Profession">
                <div className="relative">
                  <Icons.briefcase className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={draft.profession}
                    onChange={(e) => onChange("profession", e.target.value)}
                    aria-label="Filter by author profession"
                    className={fieldCls}
                  >
                    <option value="">
                      {professionsLoading
                        ? "Loading professions..."
                        : "All professions"}
                    </option>
                    {professions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                        {p.count ? ` (${p.count})` : ""}
                      </option>
                    ))}
                  </select>
                  <Icons.chevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </Field>

              {/* Author gender */}
              <Field label="Author gender">
                <div className="relative">
                  <Icons.user className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={draft.gender}
                    onChange={(e) => onChange("gender", e.target.value)}
                    aria-label="Filter by author gender"
                    className={fieldCls}
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <Icons.chevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </Field>

              {/* Following only — signed-in readers have a follow list */}
              {canFilterFollowing && (
                <div>
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Authors
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange("followingOnly", !draft.followingOnly)
                    }
                    aria-pressed={draft.followingOnly}
                    className={`inline-flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      draft.followingOnly
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icons.heartRegular className="h-4 w-4" />
                      Only authors I follow
                    </span>

                    <span
                      className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                        draft.followingOnly ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-card transition-all ${
                          draft.followingOnly ? "left-[1.125rem]" : "left-0.5"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              )}
            </div>

            <footer className="border-t border-border/60 px-5 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClear}
                  disabled={count === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Icons.refresh className="h-4 w-4" />
                  Clear all
                </button>

                <button
                  type="button"
                  onClick={onApply}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <Icons.check className="h-4 w-4" />
                  Show {count > 0 ? "filtered" : "all"} stories
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
