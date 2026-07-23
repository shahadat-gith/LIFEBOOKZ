import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import { Icons } from "../../icons";
import { getTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
      setComments((prev) => [res.data.data, ...prev]);
      setContent("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
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
                      ? "Add a thought..."
                      : "Sign in to participate..."
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
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="flex gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors"
                  >
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
                    </div>
                  </div>
                ))}

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