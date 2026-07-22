import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import { Icons } from "../../icons";
import { getTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CONTENT_PREVIEW_HEIGHT = 280;

function LikeButton({ storyId, liked, likeCount, onLike }) {
  const [animating, setAnimating] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLike(e) {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast("Sign in to like stories");
      navigate("/login");
      return;
    }
    setAnimating(true);
    try {
      const res = await api.post(`/stories/${storyId}/like`);
      onLike(res.data.data.liked);
    } catch {
      toast.error("Failed to like");
    } finally {
      setTimeout(() => setAnimating(false), 300);
    }
  }

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        liked
          ? "text-red-500 bg-red-500/10"
          : "text-muted-foreground hover:text-red-400 hover:bg-muted/50"
      } ${animating ? "scale-110" : "scale-100"}`}
    >
      {liked ? (
        <Icons.heartSolid className="h-4 w-4" />
      ) : (
        <Icons.heartRegular className="h-4 w-4" />
      )}
      <span>{likeCount}</span>
    </button>
  );
}

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
        res.data.data.pagination?.page < res.data.data.pagination?.pages
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

export default function FeedPost({ story }) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const [liked, setLiked] = useState(story.likedByUser || false);
  const [likeCount, setLikeCount] = useState(story.stats?.likes || 0);
  const [commentTrigger, setCommentTrigger] = useState(0);
  const contentRef = useRef(null);

  const authorName = story.author?.fullName || "Unknown Author";
  const timeAgo = getTimeAgo(new Date(story.publishedAt || story.createdAt));
  const storyTitle = story.title || "Untitled Story";
  const commentCount = story.stats?.comments || 0;
  const viewCount = story.stats?.views || 0;

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(story.content || ""),
    [story.content]
  );

  // Check on mount whether content overflows
  useEffect(() => {
    if (contentRef.current) {
      const scrollH = contentRef.current.scrollHeight;
      const clientH = contentRef.current.clientHeight;
      setNeedsTruncation(scrollH > clientH + 10);
    }
  }, [sanitizedContent]);

  // Increment view on mount with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      api.post(`/stories/${story._id}/view`).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [story._id]);

  function handleLike(nowLiked) {
    setLiked(nowLiked);
    setLikeCount((c) => (nowLiked ? c + 1 : c - 1));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Post Header: Author + metadata */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar
            src={story.author?.avatar?.url}
            name={authorName}
            size="md"
            className="ring-2 ring-border/50"
          />
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground truncate block">
              {authorName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span>{timeAgo}</span>
              {story.publishedAt && (
                <>
                  <span>•</span>
                  <span>
                    {new Date(story.publishedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Story Title */}
        <h2 className="text-lg font-bold text-foreground mt-3 leading-snug">
          {storyTitle}
        </h2>
      </div>

      {/* Post Content with Expand/Collapse */}
      <div className="relative">
        <div
          ref={contentRef}
          className="prose prose-sm dark:prose-invert max-w-none px-4 transition-all duration-300"
          style={
            !expanded
              ? { maxHeight: CONTENT_PREVIEW_HEIGHT, overflow: "hidden" }
              : { maxHeight: "none" }
          }
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
        {!expanded && needsTruncation && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        )}
        {needsTruncation && (
          <div className="px-4 pb-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-t border-border/30 mt-1">
        <span className="flex items-center gap-1">
          {liked ? (
            <Icons.heartSolid className="h-3.5 w-3.5 text-red-500" />
          ) : (
            <Icons.heartRegular className="h-3.5 w-3.5" />
          )}
          {likeCount} like{likeCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Icons.chat className="h-3.5 w-3.5" />
          {commentCount} comment{commentCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Icons.eye className="h-3.5 w-3.5" />
          {viewCount} view{viewCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-t border-border/30">
        <LikeButton
          storyId={story._id}
          liked={liked}
          likeCount={likeCount}
          onLike={handleLike}
        />
        <button
          onClick={() => setCommentTrigger((c) => c + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <Icons.chat className="h-4 w-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* Inline Comment Section */}
      <div className="px-4 pb-3">
        <CommentSection
          storyId={story._id}
          commentTrigger={commentTrigger}
        />
      </div>
    </motion.div>
  );
}

export { LikeButton, CommentSection };
