import { Link } from "react-router-dom";
import { Avatar } from "../ui";
import { Icons } from "../../icons";
import { getTimeAgo } from "../../utils/helpers";

export function StoryCard({ story, showAuthor = true }) {
  const authorName = story.author?.fullName || "Unknown";
  const date = story.publishedAt || story.createdAt;
  const timeAgo = getTimeAgo(new Date(date));
  const storyTitle = story.title || "Untitled Story";

  const summaryContent =
    typeof story.summary === "string" ? story.summary : story.summary?.content;

  return (
    <Link to={`/stories/${story._id}`} className="group block h-full">
      <article className="overflow-hidden h-full flex flex-col rounded-xl border border-border/60 bg-card/50 text-card-foreground backdrop-blur-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all duration-300">
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-base font-semibold tracking-tight text-foreground line-clamp-1 mb-2 group-hover:text-primary transition-colors duration-200 font-display">
            {storyTitle}
          </h3>

          {/* Summary / Content */}
          {summaryContent ? (
            <p className="text-xs sm:text-sm text-muted-foreground/90 line-clamp-3 mb-4 flex-1 leading-relaxed font-sans">
              {summaryContent}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          {/* Social Stats */}
          <div className="flex items-center gap-4 mb-3.5 text-muted-foreground/60 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <Icons.heartRegular className="h-3.5 w-3.5" />
              <span>{story.stats?.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.chat className="h-3.5 w-3.5" />
              <span>{story.stats?.comments || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.eye className="h-3.5 w-3.5" />
              <span>{story.stats?.views || 0}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
            {showAuthor ? (
              <div className="flex items-center gap-2">
                <Avatar
                  src={story.author?.avatar?.url}
                  name={authorName}
                  size="sm"
                  className="ring-1 ring-border/50"
                />
                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[110px]">
                  {authorName}
                </span>
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono">
              <Icons.clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default StoryCard;