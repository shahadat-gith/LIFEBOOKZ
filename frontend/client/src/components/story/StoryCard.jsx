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
    return extractTextFromDocument(story.document, fixedSnippetLength);
  }, [story.document, fixedSnippetLength]);

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
    const url = `${window.location.origin}/feed/story/${storySlug}`;
    if (navigator.share) {
      navigator.share({ title: storyTitle, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-border transition-all duration-300"
    >
      {/* Cover Image */}
      <Link to={`/feed/story/${storySlug}`} className="block">
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-muted/60">
          {story.coverImage?.url ? (
            <img
              src={story.coverImage.url}
              alt={storyTitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-muted-foreground/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </Link>

      {/* Header: Author Info & Follow Button */}
      <div className={`flex items-center justify-between gap-4 ${story.coverImage?.url ? 'p-5 pb-3' : 'p-5 pb-3'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/authors/${author._id}`}>
            <Avatar
              src={author.avatar?.url}
              name={authorName}
              size="md"
              className="ring-1 ring-border/80 transition-transform group-hover:scale-105"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/authors/${author._id}`}
              className="text-sm font-semibold text-foreground tracking-tight truncate block hover:text-accent transition-colors"
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
        <h2 className="font-display text-xl font-bold text-foreground leading-snug tracking-tight hover:text-accent transition-colors">
          {storyTitle}
        </h2>
      </Link>

      {/* Story Summary */}
      {story.summary?.content ? (
        <div className="px-5 pb-2">
          <p className="text-sm text-foreground/80 leading-relaxed font-sans line-clamp-3">
            {story.summary.content}
          </p>
        </div>
      ) : (
        <Link to={`/feed/story/${storySlug}`} className="block px-5">
          <p className="text-sm text-foreground/80 leading-relaxed font-sans line-clamp-3">
            {snippetText}
          </p>
        </Link>
      )}
      <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
          Read full story
          <Icons.chevronRight className="h-3 w-3" />
        </span>
      </Link>

      {/* Interactive Stats Row: Like · Comment · Share — left aligned */}
      {showActions && (
        <div className="px-5 pt-4 pb-5 mt-1 border-t border-border/40">
        <div className="flex items-center gap-6">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none ${
              liked
                ? "text-destructive"
                : "text-muted-foreground hover:text-destructive"
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
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
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
