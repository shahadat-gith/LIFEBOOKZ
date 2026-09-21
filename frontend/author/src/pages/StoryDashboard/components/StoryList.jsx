import { useMemo, useState } from "react";
import { Icons } from "../../../icons";
import { getTimeAgo } from "../../../utils/helpers";
import { chapterLabel } from "../../../utils/chapters";
import StoryTypeBadge from "../../../components/common/StoryTypeBadge";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
];

function StoryThumb({ src, alt }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-14 w-14 shrink-0 rounded-xl object-cover"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted/60">
      <Icons.document className="h-5 w-5 text-muted-foreground/50" />
    </div>
  );
}

/**
 * Every story the author has written, across all lifebooks and chapters,
 * filterable by status, with edit / view / remove actions per row.
 */
export default function StoryList({
  rows = [],
  loading = false,
  onEdit,
  onView,
  onRemove,
  removingId = null,
}) {
  const [filter, setFilter] = useState("all");

  const counts = useMemo(
    () => ({
      all: rows.length,
      published: rows.filter((r) => r.status === "published").length,
      draft: rows.filter((r) => r.status === "draft").length,
    }),
    [rows],
  );

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
        <h2 className="font-display text-base font-bold text-foreground">
          All stories
        </h2>

        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="space-y-2 p-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Icons.document className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
          <p className="font-display font-semibold text-foreground">
            {rows.length === 0 ? "No stories yet" : "Nothing in this filter"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length === 0
              ? "Write your first story from the + button."
              : "Try another filter to see your other stories."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {visible.map((row) => {
            const published = row.status === "published";
            const busy = removingId === row.id;

            return (
              <li
                key={row.id}
                className="flex items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
              >
                <StoryThumb src={row.thumb} alt={row.story.title} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StoryTypeBadge type={row.story.storyType} />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        published ? "text-success" : "text-warning"
                      }`}
                    >
                      {published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <h3 className="mt-1 truncate font-semibold text-foreground">
                    {row.story.title || "Untitled"}
                  </h3>

                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {row.preview || "No content yet."}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Icons.book className="h-3 w-3" />
                      {chapterLabel(row.chapter)}
                    </span>
                    {row.mediaCount > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Icons.camera className="h-3 w-3" />
                        {row.mediaCount}
                      </span>
                    )}
                    {row.words > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Icons.document className="h-3 w-3" />
                        {row.words} words
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Icons.clock className="h-3 w-3" />
                      {getTimeAgo(row.story.updatedAt || row.story.createdAt) ||
                        "recently"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {published && row.book?.slug && (
                    <button
                      type="button"
                      onClick={() => onView(row)}
                      title="Read in feed"
                      aria-label="Read in feed"
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Icons.eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    title="Edit story"
                    aria-label="Edit story"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icons.edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(row)}
                    disabled={busy}
                    title="Remove story"
                    aria-label="Remove story"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {busy ? (
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.trash className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
