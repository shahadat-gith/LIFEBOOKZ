import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import Avatar from "../ui/Avatar";
import FollowButton from "./FollowButton";
import { Icons } from "../../icons";
import { getTimeAgo, getPlainTextSnippet } from "../../utils/helpers";

export default function StoryCard({
  story,
  fixedSnippetLength = 200,
}) {
  const [liked] = useState(story.likedByUser || false);
  const [likeCount] = useState(story.stats?.likes || 0);

  const author = story.author || {};
  const authorName = author.fullName || "Anonymous Author";
  const timeAgo = getTimeAgo(new Date(story.publishedAt || story.createdAt));
  const storyTitle = story.title || "Untitled Story";
  const storySlug = story.slug || story._id;

  const recentLikers = story.recentLikers || [];
  const commentCount = story.stats?.comments || 0;

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(story.content || ""),
    [story.content]
  );

  const snippetText = useMemo(() => {
    if (story.summary?.content) return story.summary.content;
    return getPlainTextSnippet(sanitizedContent, fixedSnippetLength);
  }, [sanitizedContent, fixedSnippetLength, story.summary?.content]);

  // Instagram-style "Liked by username and X others"
  function LikeMeta() {
    if (likeCount === 0) return null;

    const firstLiker = recentLikers.filter(Boolean)[0];

    if (liked) {
      const others = likeCount - 1;
      return (
        <p className="text-xs text-foreground/80 font-medium">
          Liked by <span className="font-semibold">you</span>
          {others > 0 && <> and <span className="font-semibold">{others.toLocaleString()} others</span></>}
        </p>
      );
    }

    if (!firstLiker) return null;

    const others = likeCount - 1;
    return (
      <p className="text-xs text-foreground/80 font-medium">
        Liked by <span className="font-semibold">{firstLiker}</span>
        {others > 0 && <> and <span className="font-semibold">{others.toLocaleString()} others</span></>}
      </p>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-border transition-all duration-300"
    >
      {/* Header: Author Info & Follow Button */}
      <div className="p-5 pb-3 flex items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{timeAgo}</span>
              {story.language && (
                <span className="text-accent/80 font-medium text-[10px] uppercase">
                  {story.language}
                </span>
              )}
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

      {/* Story Content Preview */}
      <Link to={`/feed/story/${storySlug}`} className="block px-5">
        <p className="text-sm text-foreground/80 leading-relaxed font-sans line-clamp-3">
          {snippetText}
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
            Read full story
            <Icons.chevronRight className="h-3 w-3" />
          </span>
        </div>
      </Link>

      {/* Instagram-style Stats Footer — purely visual, no interactions */}
      <div className="px-5 pt-4 pb-5 mt-3 border-t border-border/40">
        {/* Icon bar — visual only */}
        <div className="flex items-center gap-3 text-foreground/60">
          <span className="flex items-center gap-1">
            {liked ? (
              <Icons.heartSolid className="h-4 w-4 text-destructive" />
            ) : (
              <Icons.heartRegular className="h-4 w-4" />
            )}
          </span>
          <span className="flex items-center gap-1">
            <Icons.chat className="h-4 w-4" />
          </span>
        </div>

        {/* Instagram-style like text */}
        <LikeMeta />

        {/* Comment count */}
        {commentCount > 0 && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {commentCount} comment{commentCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </motion.article>
  );
}
