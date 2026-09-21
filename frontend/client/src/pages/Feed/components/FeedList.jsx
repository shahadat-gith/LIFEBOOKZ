import { motion } from "framer-motion";

import StoryCard from "../../../components/story/StoryCard";
import StoryCardSkeleton from "../../../components/skeletons/StoryCardSkeleton";
import Spinner from "../../../components/ui/Spinner";
import NoDataState from "../../../components/common/NoDataState";
import { Icons } from "../../../icons";

/**
 * The stories themselves: skeletons on the first load, an empty state when
 * there is nothing to show, then the cards with the infinite-scroll sentinel
 * and the end-of-feed marker.
 */
export default function FeedList({
  stories,
  loading,
  loadingMore,
  hasMore,
  isFiltered,
  sentinelRef,
}) {
  if (loading && stories.length === 0) {
    return (
      <div className="space-y-5">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <StoryCardSkeleton key={n} />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <NoDataState
        icon={Icons.document}
        title={isFiltered ? "No matching stories" : "No stories yet"}
        description={
          isFiltered
            ? "Try adjusting or clearing your filters."
            : "Be the first to explore stories from the community."
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {stories.map((story, index) => (
        <motion.div
          key={story._id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.03, 0.3) }}
        >
          <StoryCard story={story} />
        </motion.div>
      ))}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Spinner size="md" label="Loading more..." />
        </div>
      )}

      {!hasMore && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <div className="h-px w-8 bg-border" />
            <span>You&apos;ve reached the end</span>
            <div className="h-px w-8 bg-border" />
          </div>
        </div>
      )}
    </div>
  );
}
