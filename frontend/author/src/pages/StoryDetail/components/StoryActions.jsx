import useStoryActions from "../../../hooks/useStoryActions";
import { formatLikesCaption } from "../../../utils/helpers";
import { Icons } from "../../../icons";

/**
 * Like · Comment · Share, with the "Liked by …" caption underneath.
 *
 * Readings actions work here exactly as they do in the client portal, and the
 * behaviour itself comes from the shared story-actions hook.
 */
export default function StoryActions({ story, onComment }) {
  const { liked, likeCount, recentLikers, toggleLike, shareStory } =
    useStoryActions(story);

  const likesCaption = formatLikesCaption(recentLikers, likeCount);

  return (
    <>
      <div className="mt-6 flex items-center gap-8 border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike this story" : "Like this story"}
          className={`flex select-none items-center gap-1.5 text-sm font-semibold transition-colors ${
            liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
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
          <span>{story.stats?.comments || 0}</span>
        </button>

        <button
          type="button"
          onClick={shareStory}
          aria-label="Share this story"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icons.share className="h-5 w-5" />
          <span>{story.stats?.shares || 0}</span>
        </button>
      </div>

      {likesCaption && (
        <p className="mt-2.5 text-xs text-muted-foreground">{likesCaption}</p>
      )}
    </>
  );
}
