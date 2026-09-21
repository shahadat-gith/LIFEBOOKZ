import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../config/axios";
import { useAuth } from "../../../context/AuthContext";
import Avatar from "../../../components/ui/Avatar";
import { Icons } from "../../../icons";
import { getTimeAgo } from "../../../utils/helpers";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/**
 * Comment section with:
 *  - likes on comments (any signed-in account can like)
 *  - author-only threaded replies (shown to everyone, written by the author)
 */
export default function CommentSection({ storyId, commentTrigger }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Focus input & expand drawer when commentTrigger fires
  useEffect(() => {
    if (commentTrigger > 0) {
      setShowComments(true);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [commentTrigger]);

  async function loadComments(pageNum = 1) {
    if (pageNum === 1) setLoading(true);
    try {
      const res = await api.get(`/stories/${storyId}/comments`, {
        params: { page: pageNum, limit: 5 },
      });
      const newComments = res.data.data.comments || [];
      if (pageNum === 1) setComments(newComments);
      else setComments((prev) => [...prev, ...newComments]);
      setHasMoreComments(
        res.data.data.pagination?.page < res.data.data.pagination?.pages,
      );
    } catch {
      // Silently fail
    } finally {
      if (pageNum === 1) setLoading(false);
    }
  }

  useEffect(() => {
    if (showComments && comments.length === 0) {
      setCommentPage(1);
      loadComments(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast("Sign in to join the conversation");
      navigate("/login");
      return;
    }
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/stories/${storyId}/comments`, {
        content: content.trim(),
      });
      setComments((prev) => [{ ...res.data.data, replies: [] }, ...prev]);
      setContent("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLike(comment) {
    if (!isAuthenticated) {
      toast("Sign in to like comments");
      navigate("/login");
      return;
    }

    const nextLiked = !comment.likedByMe;
    // Optimistic update
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id || c._id === comment.id || c._id === comment._id
          ? {
              ...c,
              likedByMe: nextLiked,
              likeCount: Math.max(0, (c.likeCount || 0) + (nextLiked ? 1 : -1)),
            }
          : c,
      ),
    );

    try {
      const res = await api.post(`/stories/comments/${comment.id || comment._id}/like`);
      const { liked, likeCount } = res.data.data || {};
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id || c._id === comment.id || c._id === comment._id
            ? { ...c, likedByMe: liked, likeCount }
            : c,
        ),
      );
    } catch {
      // Revert
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id || c._id === comment.id || c._id === comment._id
            ? { ...c, likedByMe: comment.likedByMe, likeCount: comment.likeCount }
            : c,
        ),
      );
      toast.error("Failed to update like");
    }
  }

  const commentCount = comments.length;

  return (
    <div className="pt-2">
      {/* Toggle Comments Trigger */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1 group"
      >
        {Icons?.chat && <Icons.chat className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />}
        <span>
          {commentCount > 0
            ? `View ${commentCount} comment${commentCount !== 1 ? "s" : ""}`
            : "Write a comment"}
        </span>
        {Icons?.chevronDown && (
          <Icons.chevronDown
            className={`h-3 w-3 transition-transform duration-300 ${
              showComments ? "rotate-180 text-foreground" : ""
            }`}
          />
        )}
      </button>

      {/* Comment Drawer Animation */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2.5 mt-3 mb-4">
              {isAuthenticated && (
                <Avatar
                  src={user?.avatar?.url}
                  name={user?.fullName || "User"}
                  size="sm"
                  className="shrink-0 ring-1 ring-border/60"
                />
              )}
              
              <div className="flex-1 flex items-center gap-2 bg-card border border-border/70 rounded-xl px-3 py-1.5 focus-within:border-accent/80 focus-within:ring-1 focus-within:ring-accent/30 transition-all shadow-xs">
                <input
                  ref={inputRef}
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    isAuthenticated
                      ? "Write a comment"
                      : "Sign in to join the conversation"
                  }
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95"
                >
                  {submitting ? (
                    Icons?.spinner ? (
                      <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "..."
                    )
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>

            {/* Comments List */}
            {loading ? (
              <div className="flex items-center justify-center py-4">
                {Icons?.spinner ? (
                  <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground/60" />
                ) : (
                  <span className="text-xs text-muted-foreground">Loading...</span>
                )}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-xs text-muted-foreground font-medium">
                  No comments yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 mb-2">
                {comments.map((comment) => {
                  const cid = comment.id || comment._id;

                  return (
                    <div
                      key={cid}
                      className="p-3 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex gap-2.5">
                        <Avatar
                          src={comment.user?.avatar?.url}
                          name={comment.user?.fullName || "Anonymous"}
                          size="sm"
                          className="shrink-0 mt-0.5 ring-1 ring-border/50"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                              {comment.user?.fullName || "Anonymous"}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-sans">
                              {getTimeAgo(new Date(comment.createdAt))}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>

                          {/* Like — replies themselves stay read-only here:
                              only a story's author may write them. */}
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(comment)}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                                comment.likedByMe
                                  ? "text-destructive"
                                  : "text-muted-foreground hover:text-destructive"
                              }`}
                            >
                              {comment.likedByMe ? (
                                <Icons.heartSolid className="h-3.5 w-3.5" />
                              ) : (
                                <Icons.heartRegular className="h-3.5 w-3.5" />
                              )}
                              {(comment.likeCount || 0) > 0 && comment.likeCount}
                            </button>
                          </div>

                          {/* Author replies */}
                          {(comment.replies || []).length > 0 && (
                            <div className="mt-3 space-y-2.5 border-l-2 border-accent/30 pl-3">
                              {comment.replies.map((reply) => (
                                <div key={reply._id || reply.id} className="flex gap-2">
                                  <Avatar
                                    src={reply.avatar || undefined}
                                    name={reply.fullName || "Author"}
                                    size="sm"
                                    className="shrink-0 !h-6 !w-6 !text-[9px] ring-1 ring-accent/40"
                                  />
                                  <div className="min-w-0 flex-1 rounded-lg bg-accent/5 border border-accent/15 px-2.5 py-1.5">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-[11px] font-bold text-foreground truncate">
                                        {reply.fullName || "Author"}
                                        <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                                          Author
                                        </span>
                                      </span>
                                      <span className="text-[10px] text-muted-foreground shrink-0">
                                        {getTimeAgo(new Date(reply.createdAt))}
                                      </span>
                                    </div>
                                    <p className="text-xs text-foreground/90 mt-0.5 leading-relaxed whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Trigger */}
                {hasMoreComments && (
                  <div className="pt-1 text-center">
                    <button
                      onClick={() => {
                        const next = commentPage + 1;
                        setCommentPage(next);
                        loadComments(next);
                      }}
                      className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
                    >
                      <span>View more comments</span>
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
