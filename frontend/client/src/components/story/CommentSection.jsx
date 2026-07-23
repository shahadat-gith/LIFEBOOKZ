import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Textarea, Button } from "../ui";
import Spinner from "../ui/Spinner";
import { Icons } from "../../icons";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function CommentSection({ storyId, commentTrigger }) {
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

  // When commentTrigger changes, open comments and focus input
  useEffect(() => {
    if (commentTrigger > 0) {
      setShowComments(true);
      setTimeout(() => inputRef.current?.focus(), 300);
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
      // silently fail
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
      toast("Sign in to comment");
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
    <div className="border-t border-border/40 pt-3 mt-2">
      {/* Toggle comments button */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <Icons.chat className="h-3.5 w-3.5" />
        <span>
          {commentCount > 0
            ? `View ${commentCount} comment${commentCount !== 1 ? "s" : ""}`
            : "Comment"}
        </span>
        <Icons.chevronDown
          className={`h-3 w-3 transition-transform ${
            showComments ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Comment form */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
              {isAuthenticated && (
                <Avatar
                  src={user?.avatar?.url}
                  name={user?.fullName}
                  size="sm"
                  className="flex-shrink-0 mt-1"
                />
              )}
              <div className="flex-1 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    isAuthenticated
                      ? "Write a comment..."
                      : "Sign in to comment"
                  }
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>

            {/* Comments list */}
            {loading ? (
              <div className="flex justify-center py-3">
                <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No comments yet. Be the first!
              </p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="flex gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <Avatar
                      src={comment.user?.avatar?.url}
                      name={comment.user?.fullName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">
                          {comment.user?.fullName || "Anonymous"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {getTimeAgo(new Date(comment.createdAt))}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 mt-0.5 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                {hasMoreComments && (
                  <button
                    onClick={() => {
                      const next = commentPage + 1;
                      setCommentPage(next);
                      loadComments(next);
                    }}
                    className="text-xs text-accent hover:underline mt-1"
                  >
                    View more comments
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CommentSection;
