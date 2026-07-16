import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { Icons } from '../../icons';
import type { StorySummary } from '../../types';

interface StoryCardProps {
  story: StorySummary;
  showAuthor?: boolean;
}

export function StoryCard({ story, showAuthor = true }: StoryCardProps) {
  const authorName = story.author?.fullName || story.author?.fullName || 'Unknown';
  const date = story.publishedAt || story.createdAt;
  const timeAgo = getTimeAgo(new Date(date));
  const summaryContent = typeof story.summary === 'string' ? story.summary : story.summary?.content;

  return (
    <Link to={`/stories/${story._id}`}>
      <Card hover padding="none" className="overflow-hidden h-full flex flex-col">
        <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
          <Icons.book className="h-12 w-12 text-muted-foreground/30" />
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {story.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="primary" className="text-[10px]">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {story.title}
          </h3>

          {/* Summary */}
          {summaryContent && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {summaryContent}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
            {showAuthor ? (
              <div className="flex items-center gap-2">
                <Avatar
                  src={story.author?.avatar?.url}
                  name={authorName}
                  size="sm"
                />
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[100px]">
                  {authorName}
                </span>
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icons.clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}


export default StoryCard;
