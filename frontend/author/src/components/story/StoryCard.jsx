import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import FollowAuthorButton from "./FollowAuthorButton";
import { Icons } from "../../icons";
import { getTimeAgo, formatLikesCaption } from "../../utils/helpers";
import { share } from "../../utils/share";

/**
 * Feed card for published lifebooks in the author portal.
 *
 * Authors read each other's lifebooks the same way readers do, so the card
 * carries the same like / comment / share actions as the client portal —
 * only the follow button differs (author-role follow instead of reader).
 * `showActions` lets a screen show the card as a plain preview.
 */
export default function StoryCard({ story, showActions = true }) {
  const navigate = useNavigate();
  const { author: viewer, isAuthenticated } = useAuth();

  const [liked, setLiked] = useState(story.likedByUser || false);
  const [likeCount, setLikeCount] = useState(story.stats?.likes || 0);
  const [recentLikers, setRecentLikers] = useState(story.recentLikers || []);

  const author = story.author || {};
  const authorName = author.fullName || "Anonymous Author";
  const isVerified = author.verification?.status === "approved";
  const storyTitle = story.title || "Untitled Story";
  const storySlug = story.slug || story._id;
  const profession = story.authorProfession || author.profession || "";
  const authorMeta = [profession, getTimeAgo(story.publishedAt || story.createdAt)]
    .filter(Boolean)
    .join(" · ");

  const commentCount = story.stats?.comments || 0;
  const shareCount = story.stats?.shares || 0;
  const likesCaption = formatLikesCaption(recentLikers, likeCount);

  const chapterCount = story.chapters?.length || 0;
  const storyCount = (story.chapters || []).reduce(
    (sum, ch) => sum + (ch.stories?.length || 0),
    0,
  );

  async function handleLike(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast("Sign in to like stories");
      navigate("/login");
      return;
    }

    const next = !liked;
    const viewerId = viewer?.id || viewer?._id;

    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    setRecentLikers((prev) => {
      const list = prev || [];
      const withoutMe = list.filter((l) => String(l.user) !== String(viewerId));
      return next
        ? [{ user: viewerId, fullName: viewer?.fullName || "You" }, ...withoutMe].slice(0, 3)
        : withoutMe;
    });

    try {
      const res = await api.post(`/stories/${story._id}/like`);
      const serverLiked = res.data?.data?.liked;
      if (serverLiked !== undefined && serverLiked !== next) {
        setLiked(serverLiked);
        setLikeCount((c) => (serverLiked ? c + 1 : c - 1));
      }
    } catch {
      setLiked(liked);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
      setRecentLikers(story.recentLikers || []);
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

    toast.success(shared ? "Shared successfully!" : "Link copied to clipboard");
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-200 select-none hover:border-border"
    >
      {/* Cover Image */}
      <Link to={`/feed/story/${storySlug}`} className="block">
        <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-56">
          {story.coverImage?.url ? (
            <img
              src={story.coverImage.url}
              alt={storyTitle}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center border-b border-border/40">
              <Icons.book className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>

      {/* Header: Author Info & Follow Button */}
      <div className="flex items-center justify-between gap-4 p-5 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            src={author.avatar?.url}
            name={authorName}
            size="md"
            className="shrink-0 ring-1 ring-border/60 transition-opacity hover:opacity-80"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-semibold tracking-tight text-foreground">
              <span className="truncate">{authorName}</span>
              {isVerified && (
                <Icons.verified
                  aria-label="Verified author"
                  title="Verified author"
                  className="h-4 w-4 shrink-0 text-info"
                />
              )}
            </p>
            {authorMeta && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{authorMeta}</p>
            )}
          </div>
        </div>

        <FollowAuthorButton authorId={author._id || author.id} size="sm" iconOnly />
      </div>

      {/* Story Title */}
      <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-2">
        <h2 className="font-display text-lg font-bold leading-snug tracking-tight text-foreground transition-all hover:underline">
          {storyTitle}
        </h2>
      </Link>

      {/* Chapter Count Badge */}
      {chapterCount > 1 && (
        <div className="px-5 pb-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Icons.book className="h-3 w-3" />
            {chapterCount} chapters
            {storyCount > 0 && ` · ${storyCount} stories`}
          </span>
        </div>
      )}

      {/* Read link */}
      <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground transition-all hover:underline">
          Read full story
          <Icons.chevronRight className="h-3 w-3" />
        </span>
      </Link>

      {/* Interactive Stats Row */}
      {showActions && (
        <div className="border-t border-border/60 px-5 pt-3 pb-4">
          <div className="flex items-center gap-6">
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              aria-pressed={liked}
              aria-label={liked ? "Unlike this story" : "Like this story"}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors select-none ${
                liked ? "text-destructive" : "text-muted-foreground hover:text-foreground"
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
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icons.chat className="h-4 w-4" />
              <span>{commentCount}</span>
            </Link>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share this story"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icons.share className="h-4 w-4" />
              <span>{shareCount}</span>
            </button>
          </div>

          {/* Instagram-style like caption */}
          {likesCaption && (
            <p className="mt-2.5 text-xs text-muted-foreground">{likesCaption}</p>
          )}
        </div>
      )}
    </motion.article>
  );
}
