import { Link } from "react-router-dom";
import Avatar from "../../../components/ui/Avatar";
import { Icons } from "../../../icons";
import { getTimeAgo } from "../../../utils/helpers";
import { isVerifiedAuthor } from "../../../utils/authors";

export default function StoryTile({ story }) {
  const author = story.author || {};
  const authorName = author.fullName || "Anonymous Author";
  const authorId = author._id || author.id;
  const isVerified = isVerifiedAuthor(author);
  const storyTitle = story.title || "Untitled Story";
  const storySlug = story.slug || story._id;
  const timeAgo = getTimeAgo(new Date(story.publishedAt || story.createdAt));

  const likeCount = story.stats?.likes || 0;
  const commentCount = story.stats?.comments || 0;
  const shareCount = story.stats?.shares || 0;

  const meta = [author.profession, timeAgo].filter(Boolean).join(" · ");

  return (
    <article className="group relative flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-lg sm:w-[340px]">
      {/* Cover */}
      <Link
        to={`/feed/story/${storySlug}`}
        className="relative block h-44 w-full overflow-hidden bg-muted sm:h-48"
        aria-label={storyTitle}
      >
        {story.bannerImage?.url ? (
          <img
            src={story.bannerImage.url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
            <Icons.book className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Author row — opens their profile, where following lives */}
        <div className="group/author">
          <Link
            to={`/authors/${authorId}`}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Avatar
              src={author.avatar?.url}
              name={authorName}
              size="md"
              className="ring-1 ring-border/60"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-[13px] font-bold text-foreground transition-colors hover:text-primary">
                <span className="truncate">{authorName}</span>
                {isVerified && (
                  <Icons.verified
                    aria-label="Verified author"
                    title="Verified author"
                    className="h-3.5 w-3.5 shrink-0 text-blue-500"
                  />
                )}
              </p>
              {meta && (
                <p className="truncate text-[11px] font-medium text-muted-foreground">
                  {meta}
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Story line */}
        <Link
          to={`/feed/story/${storySlug}`}
          className="mt-3 block"
          aria-label={storyTitle}
        >
          <h3 className="font-display text-[17px] font-bold leading-snug tracking-tight text-foreground line-clamp-2 transition-colors duration-200 group-hover:text-primary">
            {storyTitle}
          </h3>
        </Link>

        {/* Footer */}
        <div className="mt-4 flex flex-1 items-end justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link
              to={`/feed/story/${storySlug}`}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-foreground"
              aria-label={`${likeCount} likes`}
            >
              <Icons.heartSolid className="h-4 w-4 text-rose-400" />
              {likeCount}
            </Link>
            <Link
              to={`/feed/story/${storySlug}`}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-foreground"
              aria-label={`${commentCount} comments`}
            >
              <Icons.chat className="h-4 w-4" />
              {commentCount}
            </Link>
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Icons.share className="h-4 w-4" />
              {shareCount > 0 && shareCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
