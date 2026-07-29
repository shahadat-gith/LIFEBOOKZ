import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import LikeButton from "../components/story/LikeButton";
import CommentSection from "../components/story/CommentSection";
import FollowButton from "../components/story/FollowButton";
import Spinner from "../components/ui/Spinner";
import { Icons } from "../icons";
import { getTimeAgo } from "../utils/helpers";
import toast from "react-hot-toast";

export default function StoryDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentTrigger, setCommentTrigger] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");

    api
      .get(`/stories/${slug}`)
      .then((res) => {
        const data = res.data.data;
        setStory(data);
        setLiked(data.likedByUser || false);
        setLikeCount(data.stats?.likes || 0);
      })
      .catch((err) => {
        const msg = err.response?.data?.error?.message || "Story not found";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  function handleLike(nowLiked) {
    setLiked(nowLiked);
    setLikeCount((c) => (nowLiked ? c + 1 : c - 1));
  }
  const sanitizedContent = useMemo(
    () => (story?.content ? DOMPurify.sanitize(story.content) : ""),
    [story?.content]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" label="Loading story..." />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icons.exclamationCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Story Not Found
        </h1>
        <p className="text-muted-foreground mb-8">{error || "This story doesn't exist or has been removed."}</p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Icons.chevronLeft className="h-4 w-4" />
          Back to Feed
        </Link>
      </div>
    );
  }

  const author = story.author || {};
  const authorName = author.fullName || "Anonymous";
  const timeAgo = getTimeAgo(new Date(story.publishedAt || story.createdAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-8 px-4 sm:px-6"
    >
      {/* Back Link */}
      <Link
        to="/feed"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Feed
      </Link>

      {/* Story Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Story Type Badge */}
        {story.storyType && (
          <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full mb-4">
            {story.storyType}
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-display leading-tight">
          {story.title || "Untitled Story"}
        </h1>

        {/* Author Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pb-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Link to={`/authors/${author._id}`}>
              <Avatar
                src={author.avatar?.url}
                name={authorName}
                size="md"
                className="ring-2 ring-border/60 hover:ring-accent/50 transition-all"
              />
            </Link>
            <div>
              <Link
                to={`/authors/${author._id}`}
                className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
              >
                {authorName}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{timeAgo}</span>
                {story.language && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-accent font-medium">{story.language}</span>
                  </>
                )}
                <span className="text-muted-foreground/40">•</span>
                <span>{likeCount} like{likeCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FollowButton
              authorId={author._id}
              size="sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Story Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <div
          className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Story Meta Footer */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-wrap items-center gap-6">
          {story.language && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icons.document className="h-4 w-4" />
              <span>Written in <strong className="text-foreground">{story.language}</strong></span>
            </div>
          )}
          {story.stats && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icons.heartRegular className="h-4 w-4" />
                <span>{story.stats.likes || 0} likes</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icons.chat className="h-4 w-4" />
                <span>{story.stats.comments || 0} comments</span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 mt-6 py-4 border-t border-border/40">
        <LikeButton
          storyId={story._id}
          liked={liked}
          likeCount={likeCount}
          onLike={handleLike}
        />
        <button
          type="button"
          onClick={() => setCommentTrigger((c) => c + 1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <Icons.chat className="h-4 w-4" />
          <span>Comment</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: story.title,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <Icons.share className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="mt-8 pt-6 border-t border-border/40">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Comments
        </h3>
        <CommentSection storyId={story._id} commentTrigger={commentTrigger} />
      </div>
    </motion.div>
  );
}
