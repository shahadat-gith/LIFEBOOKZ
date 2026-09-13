import { useNavigate } from "react-router-dom";
import { Icons } from "../../icons";

/** Unpublished lifebooks with edit + delete. */
export default function DraftsList({ books, onDelete, deletingId }) {
  const navigate = useNavigate();
  const drafts = books.filter((b) => b.status !== "published");

  if (drafts.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold text-foreground">Your Drafts</h2>
      </div>
      <div className="space-y-2.5">
        {drafts.map((book) => (
          <div
            key={book.id || book._id}
            className="group flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-xs"
          >
            <button
              type="button"
              className="flex-1 min-w-0 text-left"
              onClick={() => navigate(`/stories/${book.id || book._id}/edit`)}
            >
              <p className="font-semibold text-foreground truncate">
                {book.title || "Untitled Lifebook"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(book.chapters || []).length}{" "}
                {(book.chapters || []).length === 1 ? "chapter" : "chapters"} · updated{" "}
                {new Date(book.updatedAt || book.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </button>
            <button
              type="button"
              onClick={(e) => onDelete(e, book)}
              disabled={deletingId === (book.id || book._id)}
              aria-label="Delete draft"
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            >
              <Icons.trash className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
