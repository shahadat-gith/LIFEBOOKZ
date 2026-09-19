import { Icons } from "../../icons";
import { richTextToPlain } from "../../utils/richText";

const TYPE_BADGE = {
  memory: "bg-rose-500/10 text-rose-600",
  experience: "bg-blue-500/10 text-info",
  achievement: "bg-amber-400/15 text-warning",
  challenge: "bg-violet-500/10 text-violet-600",
  lesson: "bg-emerald-500/10 text-success",
  other: "bg-muted text-muted-foreground",
};

/** All stories across chapters, flat list with type + status badges. */
export default function StoriesTab({ chapterRows, empty }) {
  const rows = chapterRows.flatMap((ch) => (ch.stories || []).map((s) => ({ ...s, chapter: ch })));

  if (rows.length === 0) {
    return empty(Icons.document, "No stories yet", "Write your first story from the + button.");
  }

  return (
    <div className="space-y-3">
      {rows.map((s, i) => (
        <div key={s._id || i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                TYPE_BADGE[s.storyType] || TYPE_BADGE.other
              }`}
            >
              {s.storyType || "story"}
            </span>
            <span className="text-[11px] text-muted-foreground">{s.chapter?.title}</span>
            {s.status === "published" ? (
              <span className="ml-auto text-[10px] font-semibold text-success">Published</span>
            ) : (
              <span className="ml-auto text-[10px] font-semibold text-warning">Draft</span>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{s.title || "Untitled"}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {richTextToPlain(s.content) || "No content yet."}
          </p>
        </div>
      ))}
    </div>
  );
}
