import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import Avatar from "../ui/Avatar";
import useStoryActions from "../../hooks/useStoryActions";
import { formatLikesCaption, getTimeAgo } from "../../utils/helpers";
import { isVerifiedAuthor } from "../../utils/authors";
import { Icons } from "../../icons";

/**
 * One lifebook in the feed: its banner, author, title, size and the
 * like · comment · share row.
 *
 * The two reading actions come from the shared hook, so the card and the
 * reader behave identically. Following happens on the author's profile
 * page, so the card only links there.
 */
export default function StoryCard({ story, showActions = true }) {
  const { liked, likeCount, recentLikers, toggleLike, shareStory } =
    useStoryActions(story);

  const author = story.author || {};
  const authorName = author.fullName || "Anonymous Author";
  const isVerified = isVerifiedAuthor(author);
  const title = story.title || "Untitled Story";
  const slug = story.slug || story._id;
  const url = `/feed/story/${slug}`;
  const authorId = author._id || author.id || null;
  const authorUrl = authorId ? `/authors/${authorId}` : url;

  const profession = story.authorProfession || author.profession || "";
  const authorMeta = [profession, getTimeAgo(story.publishedAt || story.createdAt)]
    .filter(Boolean)
    .join(" · ");

  const chapterCount = story.chapters?.length || 0;
  const storyCount = (story.chapters || []).reduce(
    (sum, chapter) => sum + (chapter.stories?.length || 0),
    0,
  );

  const likesCaption = formatLikesCaption(recentLikers, likeCount);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group select-none overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-200 hover:border-border"
    >
      {/* Banner */}
      <Link to={url} className="block">
        <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-56">
          {story.bannerImage?.url ? (
            <img
              src={story.bannerImage.url}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center border-b border-border/40">
              <Icons.book className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>

      {/* Author — the whole row opens their profile, where following lives */}
      <div className="p-5 pb-3">
        <Link
          to={authorUrl}
          className="group/author flex min-w-0 items-center gap-3"
        >
          <Avatar
            src={author.avatar?.url}
            name={authorName}
            size="md"
            className="shrink-0 ring-1 ring-border/60 transition-opacity group-hover/author:opacity-80"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-semibold tracking-tight text-foreground group-hover/author:underline">
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
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {authorMeta}
              </p>
            )}
          </div>

          {authorId && (
            <Icons.chevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover/author:translate-x-0.5" />
          )}
        </Link>
      </div>

      {/* Title */}
      <Link to={url} className="block px-5 pb-2">
        <h2 className="font-display text-lg font-bold leading-snug tracking-tight text-foreground transition-all hover:underline">
          {title}
        </h2>
      </Link>

      {/* Size */}
      {chapterCount > 1 && (
        <div className="px-5 pb-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Icons.book className="h-3 w-3" />
            {chapterCount} chapters
            {storyCount > 0 && ` · ${storyCount} stories`}
          </span>
        </div>
      )}

      <Link to={url} className="block px-5 pb-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground transition-all hover:underline">
          Read full story
          <Icons.chevronRight className="h-3 w-3" />
        </span>
      </Link>

      {/* Actions */}
      {showActions && (
        <div className="border-t border-border/60 px-5 pb-4 pt-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={toggleLike}
              aria-pressed={liked}
              aria-label={liked ? "Unlike this story" : "Like this story"}
              className={`flex select-none items-center gap-1.5 text-xs font-semibold transition-colors ${
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

            <Link
              to={url}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icons.chat className="h-4 w-4" />
              <span>{story.stats?.comments || 0}</span>
            </Link>

            <button
              type="button"
              onClick={shareStory}
              aria-label="Share this story"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icons.share className="h-4 w-4" />
              <span>{story.stats?.shares || 0}</span>
            </button>
          </div>

          {likesCaption && (
            <p className="mt-2.5 text-xs text-muted-foreground">{likesCaption}</p>
          )}
        </div>
      )}
    </motion.article>
  );
}
