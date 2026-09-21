import Avatar from "../../../components/ui/Avatar";
import { getTimeAgo } from "../../../utils/helpers";

/**
 * The author's replies under a comment.
 *
 * Only the story's owner can post these (the API enforces it too), so they
 * are visually marked as coming from the author.
 */
export default function CommentReplies({ replies = [] }) {
  if (replies.length === 0) return null;

  return (
    <div className="mt-3 space-y-2.5 border-l-2 border-accent/30 pl-3">
      {replies.map((reply) => (
        <div key={reply._id || reply.id} className="flex gap-2">
          <Avatar
            src={reply.avatar || undefined}
            name={reply.fullName || "Author"}
            size="sm"
            className="shrink-0 !h-6 !w-6 !text-[9px] ring-1 ring-accent/40"
          />
          <div className="min-w-0 flex-1 rounded-lg border border-accent/15 bg-accent/5 px-2.5 py-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[11px] font-bold text-foreground">
                {reply.fullName || "Author"}
                <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                  Author
                </span>
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {getTimeAgo(reply.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
              {reply.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
