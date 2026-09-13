import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import FollowAuthorButton from "./FollowAuthorButton";
import { Icons } from "../../icons";

/**
 * Feed-style card for published lifebooks in the author portal.
 * Mirrors the client portal's StoryCard: same layout, same sections —
 * but with author-role follow (instead of reader follow) and no
 * like/comment actions, which are reader-only features.
 */
export default function StoryCard({ story }) {
  const author = story.author || {};
  const authorName = author.fullName || "Anonymous Author";
  const isVerified = author.verification?.status === "approved";
  const storyTitle = story.title || "Untitled Story";
  const storySlug = story.slug || story._id;
  const profession = story.authorProfession || author.profession || "";

  const chapterCount = story.chapters?.length || 0;
  const storyCount = (story.chapters || []).reduce(
    (sum, ch) => sum + (ch.stories?.length || 0),
    0,
  );

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
          <Avatar
            src={author.avatar?.url}
            name={authorName}
            size="md"
            className="ring-1 ring-border/60 transition-opacity hover:opacity-80 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-sm font-semibold text-foreground tracking-tight truncate">
              <span className="truncate">{authorName}</span>
              {isVerified && (
                <Icons.verified
                  aria-label="Verified author"
                  title="Verified author"
                  className="h-4 w-4 shrink-0 text-blue-500"
                />
              )}
            </p>
            {profession && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {profession}
              </p>
            )}
          </div>
        </div>

        <FollowAuthorButton authorId={author._id || author.id} size="sm" iconOnly />
      </div>

      {/* Story Title */}
      <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-2">
        <h2 className="font-display text-lg font-bold text-foreground leading-snug tracking-tight hover:underline transition-all">
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
      <Link to={`/feed/story/${storySlug}`} className="block px-5 pb-4">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline transition-all">
          Read full story
          <Icons.chevronRight className="h-3 w-3" />
        </span>
      </Link>
    </motion.article>
  );
}
