import { Icons } from "../../../icons";

/**
 * The dashboard's headline numbers.
 *
 * Only counters the system actually maintains are shown — likes and comments
 * are real increments, while views/shares are never recorded, so they are
 * deliberately absent rather than displayed as a permanent zero.
 */
const TILES = [
  { key: "published", label: "Published", Icon: Icons.checkCircle, tone: "text-success bg-success/10" },
  { key: "drafts", label: "Drafts", Icon: Icons.edit, tone: "text-warning bg-warning/10" },
  { key: "chapters", label: "Chapters", Icon: Icons.book, tone: "text-primary bg-primary/10" },
  { key: "likes", label: "Likes", Icon: Icons.heartSolid, tone: "text-destructive bg-destructive/10" },
  { key: "comments", label: "Comments", Icon: Icons.chat, tone: "text-info bg-info/10" },
];

export default function DashboardStats({ totals, loading = false }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {TILES.map(({ key, label, Icon, tone }) => (
        <div
          key={key}
          className="rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-xs"
        >
          <span
            className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}
          >
            <Icon className="h-4 w-4" />
          </span>

          {loading ? (
            <div className="h-6 w-12 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : (
            <p className="font-display text-2xl font-bold leading-none text-foreground">
              {totals?.[key] ?? 0}
            </p>
          )}

          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
