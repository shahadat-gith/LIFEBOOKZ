import { Icons } from "../../../icons";

/** Timeline of recent publishes/edits. */
export default function ActivityTab({ chapterRows, empty }) {
  const events = chapterRows
    .flatMap((ch) =>
      (ch.stories || []).map((s) => ({
        id: s._id || s.id,
        title: s.title,
        chapter: ch.label,
        date: s.updatedAt || s.createdAt,
        published: s.status === "published",
      })),
    )
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 20);

  if (events.length === 0) {
    return empty(Icons.sparkles, "No activity yet", "Your writing history shows up here.");
  }

  return (
    <div className="relative pl-5 space-y-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
      {events.map((e) => (
        <div key={e.id} className="relative">
          <span
            className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-card ${
              e.published ? "bg-success" : "bg-warning"
            }`}
          />
          <p className="text-sm font-medium text-foreground">
            {e.published ? "Published" : "Edited"} “{e.title || "Untitled"}”
          </p>
          <p className="text-xs text-muted-foreground">
            {e.chapter} · {e.date ? new Date(e.date).toLocaleDateString() : "recently"}
          </p>
        </div>
      ))}
    </div>
  );
}
