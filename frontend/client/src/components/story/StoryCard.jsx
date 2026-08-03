import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";
import FollowButton from "./FollowButton";
import { extractTextFromDocument } from "./TipTapReader";
import { Icons } from "../../icons";
import { getTimeAgo } from "../../utils/helpers";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { share } from "../../utils/share";

export default function StoryCard({
  story,
  fixedSnippetLength = 200,
  showActions = true,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(story.likedByUser || false);
  const [likeCount, setLikeCount] = useState(story.stats?.likes || 0);

  const author = story.author || {};
  const authorName = author.fullName || "Anonymous Author";
  const timeAgo = getTimeAgo(new Date(story.publishedAt || story.createdAt));
  const storyTitle = story.title || "Untitled Story";
  const storySlug = story.slug || story._id;

  const commentCount = story.stats?.comments || 0;
  const shareCount = story.stats?.shares || 0;

  const snippetText = useMemo(() => {
    return extractTextFromDocument(story.content, fixedSnippetLength);
  }, [story.content, fixedSnippetLength]);

  async function handleLike(e) {
    e.preventDefault();
    e.stopPropagation();
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

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();

    const shared = await share({
      title: storyTitle,
      text: `📖 ${storyTitle}\n\nRead this story on Lifebookz.`,
      url: `/feed/story/${storySlug}`,
    });

    if (shared) {
      toast.success("Shared successfully!");
    } else {
      toast.success("Link copied to clipboard");
    }
  }
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-card border border-border/60 rounded-xl overflow-hidden hover:border-border transition-all duration-200 select-none"
    >
      {/* Cover Image */}
      <Link to={`/feed/story/${storySlug}`} className="block">
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted">
          {story.coverImage?.url ? (
            <img
              src={story.coverImage.url}
              alt={storyTitle}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center border-b border-border/40">
              <Icons.book className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>

      {/* Header: Author Info & Follow Button */}
      <div className="flex items-center justify-between gap-4 p-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/authors/${author._id}`}>
            <Avatar
              src={author.avatar?.url}
              name={authorName}
              size="md"
              className="ring-1 ring-border/60 transition-opacity hover:opacity-80 shrink-0"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/authors/${author._id}`}
              className="text-sm font-semibold text-foreground tracking-tight truncate block hover:underline transition-all"
            >
              {authorName}
            </Link>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        <FollowButton authorId={author._id} size="sm" />
      </div>

      {/* Story Title */}
      <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-2">
        <h2 className="font-display text-lg font-bold text-foreground leading-snug tracking-tight hover:underline transition-all">
          {storyTitle}
        </h2>
      </Link>

      {/* Story Summary */}
      {story.summary ? (
        <div className="px-5 pb-2">
          <p className="text-sm text-muted-foreground leading-relaxed font-sans line-clamp-3">
            {story.summary}
          </p>
        </div>
      ) : (
        <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-2">
          <p className="text-sm text-muted-foreground leading-relaxed font-sans line-clamp-3">
            {snippetText}
          </p>
        </Link>
      )}

      {/* Read link */}
      <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline transition-all">
          Read full story
          <Icons.chevronRight className="h-3 w-3" />
        </span>
      </Link>

      {/* Interactive Stats Row */}
      {showActions && (
        <div className="px-5 pt-3 pb-4 border-t border-border/60">
          <div className="flex items-center gap-6">
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors select-none ${
                liked
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {liked ? (
                <Icons.heartSolid className="h-4 w-4" />
              ) : (
                <Icons.heartRegular className="h-4 w-4" />
              )}
              <span>{likeCount}</span>
            </button>

            {/* Comment */}
            <Link
              to={`/feed/story/${storySlug}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.chat className="h-4 w-4" />
              <span>{commentCount}</span>
            </Link>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.share className="h-4 w-4" />
              <span>{shareCount}</span>
            </button>
          </div>
        </div>
      )}
    </motion.article>
  );
}
