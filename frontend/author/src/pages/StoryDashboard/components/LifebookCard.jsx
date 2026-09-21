import { Icons } from "../../../icons";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";

const VISIBILITY = {
  public: { label: "Everyone", variant: "success", Icon: Icons.globe },
  followers: { label: "Followers", variant: "info", Icon: Icons.user },
  private: { label: "Only me", variant: "warning", Icon: Icons.lock },
};

function countLabel(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}

/** One lifebook: cover, status, its engagement counters and actions. */
export default function LifebookCard({ book, onEdit, onView }) {
  const chapters = book.chapters?.length || 0;
  const stories = (book.chapters || []).reduce(
    (n, ch) => n + (ch.stories?.length || 0),
    0,
  );
  const stats = book.stats || {};
  const visibility = VISIBILITY[book.visibility] || VISIBILITY.public;
  const cover =
    book.bannerImage?.url ||
    (book.chapters || [])
      .flatMap((ch) => ch.stories || [])
      .flatMap((s) => s.media || [])
      .find((m) => m.type === "image")?.url ||
    null;
  const published = book.status === "published";

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
      <div className="flex flex-col sm:flex-row">
        {/* Cover */}
        <div className="relative h-32 w-full shrink-0 bg-muted/60 sm:h-auto sm:w-40">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <Icons.book className="h-7 w-7 text-primary/40" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-foreground">
                {book.title || "Untitled lifebook"}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {published && book.publishedAt
                  ? `Published ${new Date(book.publishedAt).toLocaleDateString()}`
                  : "Not published yet"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <Badge variant={published ? "success" : "warning"}>
                {published ? "Published" : "Draft"}
              </Badge>
              <Badge variant={visibility.variant}>
                <visibility.Icon className="h-3 w-3" />
                {visibility.label}
              </Badge>
            </div>
          </div>

          {/* Engagement */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Icons.book className="h-3.5 w-3.5" />
              {countLabel(chapters, "chapter", "chapters")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icons.document className="h-3.5 w-3.5" />
              {countLabel(stories, "story", "stories")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icons.heartSolid className="h-3.5 w-3.5" />
              {stats.likes || 0}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icons.chat className="h-3.5 w-3.5" />
              {stats.comments || 0}
            </span>
          </div>

          {/* Who liked it */}
          {(book.recentLikers || []).length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {(book.recentLikers || []).slice(0, 4).map((liker, i) => (
                  <Avatar
                    key={liker.user || i}
                    src={liker.avatar}
                    name={liker.fullName}
                    size="sm"
                    className="h-6 w-6 text-[10px] ring-2 ring-card"
                  />
                ))}
              </div>
              <span className="truncate text-[11px] text-muted-foreground">
                {book.recentLikers[0].fullName || "Someone"}
                {(stats.likes || 0) > 1 ? ` and ${(stats.likes || 1) - 1} other${(stats.likes || 1) - 1 === 1 ? "" : "s"}` : ""}{" "}
                liked this
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {published && book.slug && (
              <button
                type="button"
                onClick={() => onView(book)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Icons.eye className="h-3.5 w-3.5" />
                Open in feed
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(book)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              <Icons.edit className="h-3.5 w-3.5" />
              Edit lifebook
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
