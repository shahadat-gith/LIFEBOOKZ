import { useRef, useState } from "react";

import Avatar from "../../../components/ui/Avatar";
import { getTimeAgo } from "../../../utils/helpers";
import { Icons } from "../../../icons";
import CommentReplies from "./CommentReplies";

/**
 * One comment: who wrote it, what they said, and — for the story's owner —
 * a reply box. Anyone signed in can like a comment; only the owner can reply,
 * which is what `canReply` gates and what the API enforces.
 */
export default function CommentItem({ comment, canReply, onToggleLike, onReply }) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const commentId = comment.id || comment._id;
  const liked = comment.likedByMe;

  async function submit(event) {
    event.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await onReply(commentId, text.trim());
      // Only on success — a failed reply keeps the box open with the text.
      setReplying(false);
      setText("");
    } catch {
      // The parent has already reported it.
    } finally {
      setSending(false);
    }
  }

  function startReplying() {
    if (replying) {
      setReplying(false);
      return;
    }
    setReplying(true);
    setText("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3 transition-colors hover:bg-muted/30">
      <div className="flex gap-2.5">
        <Avatar
          src={comment.user?.avatar?.url}
          name={comment.user?.fullName || "Anonymous"}
          size="sm"
          className="mt-0.5 shrink-0 ring-1 ring-border/50"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-xs font-semibold tracking-tight text-foreground">
              {comment.user?.fullName || "Anonymous"}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {getTimeAgo(comment.createdAt)}
            </span>
          </div>

          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
            {comment.content}
          </p>

          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => onToggleLike(comment)}
              aria-pressed={liked}
              aria-label={liked ? "Unlike this comment" : "Like this comment"}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              }`}
            >
              {liked ? (
                <Icons.heartSolid className="h-3.5 w-3.5" />
              ) : (
                <Icons.heartRegular className="h-3.5 w-3.5" />
              )}
              {(comment.likeCount || 0) > 0 && comment.likeCount}
            </button>

            {canReply && (
              <button
                type="button"
                onClick={startReplying}
                className="text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Reply
              </button>
            )}
          </div>

          <CommentReplies replies={comment.replies} />

          {canReply && replying && (
            <form onSubmit={submit} className="mt-2.5 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Reply as the author"
                className="flex-1 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40"
              >
                {sending ? "..." : "Reply"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
