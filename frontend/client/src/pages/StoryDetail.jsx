import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import TipTapReader from "../components/story/TipTapReader";
import CommentSection from "../components/story/CommentSection";
import FollowButton from "../components/story/FollowButton";
import StoryDetailSkeleton from "../components/skeletons/StoryDetailSkeleton";
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
  const commentSectionRef = useRef(null);

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

  async function handleLike() {
    if (!isAuthenticated) {
      toast("Sign in to like stories");
      navigate("/login");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    try {
      const res = await api.post(`/stories/${story._id}/like`);
      if (res.data?.data?.liked !== undefined && res.data.data.liked !== next) {
        setLiked(res.data.data.liked);
        setLikeCount((c) => (res.data.data.liked ? c + 1 : c - 1));
      }
    } catch {
      setLiked(liked);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
      toast.error("Failed to update like");
    }
  }

  function handleCommentClick() {
    setCommentTrigger((c) => c + 1);
    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: story?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }

  if (loading) {
    return <StoryDetailSkeleton />;
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
  const commentCount = story.stats?.comments || 0;
  const shareCount = story.stats?.shares || 0;

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

        {/* Cover Image */}
        {story.coverImage?.url && (
          <div className="mt-6 -mx-4 sm:-mx-6">
            <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-none sm:rounded-2xl">
              <img
                src={story.coverImage.url}
                alt={story.title || "Story cover"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
            </div>
          </div>
        )}

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
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <span>{timeAgo}</span>
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
        {/* Story Summary — at the top */}
        {story.summary && (
          <div className="mb-8 p-6 rounded-2xl bg-muted/30 border border-border/40">
            <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {story.summary}
            </p>
          </div>
        )}

        <TipTapReader document={story.content} />
      </motion.div>

      {/* Interactive Stats Row: Like · Comment · Share — left aligned */}
      <div className="mt-8 py-4 border-t border-border/40">
        <div className="flex items-center gap-8">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex flex-col items-center gap-1 text-xs font-semibold transition-all duration-200 select-none ${
              liked
                ? "text-destructive"
                : "text-muted-foreground hover:text-destructive"
            }`}
          >
            {liked ? (
              <Icons.heartSolid className="h-5 w-5" />
            ) : (
              <Icons.heartRegular className="h-5 w-5" />
            )}
            <span>{likeCount}</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={handleCommentClick}
            className="flex flex-col items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.chat className="h-5 w-5" />
            <span>{commentCount}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <Icons.share className="h-5 w-5" />
            <span>{shareCount}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div ref={commentSectionRef} className="mt-8 pt-6 border-t border-border/40">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Comments
        </h3>
        <CommentSection storyId={story._id} commentTrigger={commentTrigger} />
      </div>
    </motion.div>
  );
}
