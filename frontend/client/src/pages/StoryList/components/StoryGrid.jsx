import StoryCard from "../../../components/story/StoryCard";
import StoryCardSkeleton from "../../../components/skeletons/StoryCardSkeleton";
import { GRID_CLASS } from "../utils";

/** The stories, laid out in the explore grid. */
export default function StoryGrid({ stories }) {
  return (
    <div className={GRID_CLASS}>
      {stories.map((story) => (
        <StoryCard key={story._id} story={story} />
      ))}
    </div>
  );
}

/** The same grid, filled with placeholders while the first page loads. */
export function StoryGridSkeleton({ count = 8 }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: count }, (_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
