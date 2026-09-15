import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import { Icons } from "../../icons";
import { timeAgo } from "../../hooks/useNotifications";
import toast from "react-hot-toast";

/**
 * Author-portal comment section: authors can like any comment and reply
 * to comments on their own stories (replies are author-only on the API).
 */
export default function CommentSection({ storyId, commentTrigger }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const { author, isAuthenticated } = useAuth();
  const replyInputRef = useRef(null);

  useEffect(() => {
    if (commentTrigger > 0) {
      setShowComments(true);
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

  async function handleToggleLike(comment) {
    if (!isAuthenticated) return;
    const cid = comment.id || comment._id;
    const nextLiked = !comment.likedByMe;

    setComments((prev) =>
      prev.map((c) =>
        (c.id || c._id) === cid
          ? {
              ...c,
              likedByMe: nextLiked,
              likeCount: Math.max(0, (c.likeCount || 0) + (nextLiked ? 1 : -1)),
            }
          : c,
      ),
    );

    try {
      const res = await api.post(`/stories/comments/${cid}/like`);
      const { liked, likeCount } = res.data.data || {};
      setComments((prev) =>
        prev.map((c) =>
          (c.id || c._id) === cid ? { ...c, likedByMe: liked, likeCount } : c,
        ),
      );
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          (c.id || c._id) === cid
            ? { ...c, likedByMe: comment.likedByMe, likeCount: comment.likeCount }
            : c,
        ),
      );
      toast.error("Failed to update like");
    }
  }

  async function submitReply(comment, e) {
    e?.preventDefault();
    if (!replyText.trim() || replying) return;
    const cid = comment.id || comment._id;
    setReplying(true);
    try {
      const res = await api.post(`/stories/comments/${cid}/reply`, {
        content: replyText.trim(),
      });
      setComments((prev) =>
        prev.map((c) =>
          (c.id || c._id) === cid
            ? { ...c, replies: [...(c.replies || []), res.data.data] }
            : c,
        ),
      );
      setReplyFor(null);
      setReplyText("");
      toast.success("Reply posted");
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || "Failed to post reply";
      toast.error(msg);
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="pt-2">
      <button
        onClick={() => setShowComments(!showComments)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1 group"
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
              <div className="text-center py-4 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-xs text-muted-foreground font-medium">
                  No comments yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 mb-2">
                {comments.map((comment) => {
                  const cid = comment.id || comment._id;
                  const isReplying = replyFor === cid;

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
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {timeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>

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
                            <button
                              type="button"
                              onClick={() => {
                                setReplyFor(isReplying ? null : cid);
                                setReplyText("");
                                setTimeout(
                                  () => replyInputRef.current?.focus(),
                                  100,
                                );
                              }}
                              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Reply
                            </button>
                          </div>

                          {/* Author replies */}
                          {(comment.replies || []).length > 0 && (
                            <div className="mt-3 space-y-2.5 border-l-2 border-accent/30 pl-3">
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply._id || reply.id}
                                  className="flex gap-2"
                                >
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
                                        {timeAgo(reply.createdAt)}
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

                          {/* Reply input */}
                          {isReplying && (
                            <form
                              onSubmit={(e) => submitReply(comment, e)}
                              className="flex items-center gap-2 mt-2.5"
                            >
                              <input
                                ref={replyInputRef}
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Reply as the author"
                                className="flex-1 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                              />
                              <button
                                type="submit"
                                disabled={!replyText.trim() || replying}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-40 transition-all"
                              >
                                {replying ? "..." : "Reply"}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasMoreComments && (
                  <div className="pt-1 text-center">
                    <button
                      onClick={() => {
                        const next = commentPage + 1;
                        setCommentPage(next);
                        loadComments(next);
                      }}
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
