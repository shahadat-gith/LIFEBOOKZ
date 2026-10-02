import { Icons } from "../../../icons";

/**
 * The feed's filter trigger — an icon in the header's top-right corner.
 *
 * The badge carries how many filters are applied, so the reader can see the
 * feed is narrowed without opening the modal.
 */
export default function FilterButton({ count = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={count > 0 ? `Filters, ${count} applied` : "Filters"}
      className="relative inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-xs transition-all hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/25"
    >
      <Icons.filter className="h-5 w-5" />

      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground ring-2 ring-card">
          {count}
        </span>
      )}
    </button>
  );
}
