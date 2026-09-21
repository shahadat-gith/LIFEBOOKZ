import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../../../config/api";
import { useAuth } from "../../../context/AuthContext";
import { apiErrorMessage } from "../../../utils/helpers";
import { Icons } from "../../../icons";
import CommentItem from "./CommentItem";

const PAGE_SIZE = 5;

/**
 * Author-portal comment section: authors can like any comment, and reply to
 * comments only on their own stories (`canReply`) — which is also exactly
 * what the API allows.
 *
 * This holds the thread; one comment's markup lives in `CommentItem`.
 */
export default function CommentSection({
  storyId,
  commentTrigger,
  canReply = false,
}) {
  const { isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);

  // The page's Comment button opens the thread.
  useEffect(() => {
    if (commentTrigger > 0) setShowComments(true);
  }, [commentTrigger]);

  useEffect(() => {
    if (showComments && comments.length === 0) {
      setCommentPage(1);
      loadComments(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments]);

  async function loadComments(pageNum = 1) {
    if (pageNum === 1) setLoading(true);
    try {
      const res = await api.get(`/stories/${storyId}/comments`, {
        params: { page: pageNum, limit: PAGE_SIZE },
      });
      const batch = res.data.data.comments || [];
      setComments((prev) => (pageNum === 1 ? batch : [...prev, ...batch]));

      const pagination = res.data.data.pagination;
      setHasMoreComments(pagination?.page < pagination?.pages);
    } catch {
      // The empty state covers a failed load.
    } finally {
      if (pageNum === 1) setLoading(false);
    }
  }

  /** Optimistic, rolled back to the server's truth if the request fails. */
  async function toggleLike(comment) {
    if (!isAuthenticated) return;

    const commentId = comment.id || comment._id;
    const nextLiked = !comment.likedByMe;

    setComments((prev) =>
      prev.map((c) =>
        (c.id || c._id) === commentId
          ? {
              ...c,
              likedByMe: nextLiked,
              likeCount: Math.max(0, (c.likeCount || 0) + (nextLiked ? 1 : -1)),
            }
          : c,
      ),
    );

    try {
      const res = await api.post(`/stories/comments/${commentId}/like`);
      const { liked, likeCount } = res.data.data || {};
      setComments((prev) =>
        prev.map((c) =>
          (c.id || c._id) === commentId ? { ...c, likedByMe: liked, likeCount } : c,
        ),
      );
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          (c.id || c._id) === commentId
            ? { ...c, likedByMe: comment.likedByMe, likeCount: comment.likeCount }
            : c,
        ),
      );
      toast.error("Failed to update like");
    }
  }

  /**
   * Post the author's reply and drop it into the thread.
   *
   * A failure is re-thrown so the reply box stays open with what was typed —
   * losing a written reply to a flaky request would be worse than the error.
   */
  async function reply(commentId, content) {
    try {
      const res = await api.post(`/stories/comments/${commentId}/reply`, {
        content,
      });
      setComments((prev) =>
        prev.map((c) =>
          (c.id || c._id) === commentId
            ? { ...c, replies: [...(c.replies || []), res.data.data] }
            : c,
        ),
      );
      toast.success("Reply posted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to post reply"));
      throw err;
    }
  }

  function showMore() {
    const next = commentPage + 1;
    setCommentPage(next);
    loadComments(next);
  }

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setShowComments((open) => !open)}
        className="group inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icons.chat className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
        <span>
          {comments.length > 0
            ? `View ${comments.length} comment${comments.length !== 1 ? "s" : ""}`
            : "View comments"}
        </span>
        <Icons.chevronDown
          className={`h-3 w-3 transition-transform duration-300 ${
            showComments ? "rotate-180 text-foreground" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground/60" />
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-xl border border-border/30 bg-muted/20 py-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  No comments yet.
                </p>
              </div>
            ) : (
              <div className="mb-2 space-y-2.5">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id || comment._id}
                    comment={comment}
                    canReply={canReply}
                    onToggleLike={toggleLike}
                    onReply={reply}
                  />
                ))}

                {hasMoreComments && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={showMore}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      View more comments
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
