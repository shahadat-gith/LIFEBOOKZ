import { useAuth } from "../../context/AuthContext";
import FilterModal from "../../components/feed/FilterModal";

import FeedHeader from "./components/FeedHeader";
import FeedList from "./components/FeedList";
import useFeed from "./hooks/useFeed";

/**
 * Feed — published stories from the community.
 *
 * The filters live behind the icon in the header's top-right corner: the
 * modal edits a draft and only commits on "Show results", so narrowing the
 * feed is one request no matter how many controls were touched.
 */
export default function FeedPage() {
  const { isAuthenticated } = useAuth();
  const feed = useFeed();

  return (
    <div className="mx-auto max-w-3xl select-none px-4 py-6">
      <FeedHeader
        filterCount={feed.appliedCount}
        onOpenFilters={feed.openFilters}
      />

      <FeedList
        stories={feed.stories}
        loading={feed.loading}
        loadingMore={feed.loadingMore}
        hasMore={feed.hasMore}
        isFiltered={feed.isFiltered}
        sentinelRef={feed.sentinelRef}
      />

      <FilterModal
        open={feed.filterOpen}
        onClose={feed.closeFilters}
        draft={feed.draft}
        professions={feed.professions}
        professionsLoading={feed.professionsLoading}
        canFilterFollowing={isAuthenticated}
        onChange={feed.setDraftFilter}
        onClear={feed.clearFilters}
        onApply={feed.applyFilters}
      />
    </div>
  );
}
