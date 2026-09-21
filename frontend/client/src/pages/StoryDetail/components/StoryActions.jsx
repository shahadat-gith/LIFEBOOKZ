import { Icons } from "../../../icons";
import { formatLikesCaption } from "../../../utils/helpers";

/**
 * Like · comment · share, with the Instagram-style "Liked by …" caption
 * underneath. The like is optimistic and owned by the page, which is why the
 * counts come in rather than being read from the story here.
 */
export default function StoryActions({
  liked,
  likeCount,
  commentCount,
  shareCount,
  recentLikers,
  onLike,
  onComment,
  onShare,
}) {
  const likesCaption = formatLikesCaption(recentLikers, likeCount);

  return (
    <>
      <div className="mt-6 flex items-center gap-8 border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike this story" : "Like this story"}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors select-none ${
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

        <button
          type="button"
          onClick={onComment}
          aria-label="Comment on this story"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icons.chat className="h-5 w-5" />
          <span>{commentCount}</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          aria-label="Share this story"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <Icons.share className="h-5 w-5" />
          <span>{shareCount}</span>
        </button>
      </div>

      {likesCaption && (
        <p className="mt-2.5 text-xs text-muted-foreground">{likesCaption}</p>
      )}
    </>
  );
}
