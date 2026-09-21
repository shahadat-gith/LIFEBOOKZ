import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import NoDataState from "../../components/common/NoDataState";
import { Icons } from "../../icons";

import FilterButton from "./components/FilterButton";
import FilterModal from "./components/FilterModal";
import StoryCard from "../../components/story/StoryCard";
import StoryCardSkeleton from "./components/StoryCardSkeleton";
import EndOfFeed from "./components/EndOfFeed";
import {
  EMPTY_FILTERS,
  PAGE_SIZE,
  activeFilterCount,
  feedQuery,
} from "./utils";

/**
 * Feed — published stories from other authors.
 *
 * The filters live behind the icon in the header's top-right corner: the
 * modal edits a draft and only commits on "Show results", so narrowing the
 * feed is one request no matter how many controls were touched.
 */
export default function FeedPage() {
  const { author: viewer } = useAuth();
  const viewerId = viewer?.id || viewer?._id;

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Committed filters drive the request; `draft` is what the modal edits.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(true);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const setDraftFilter = (key, value) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  // Load the profession options for the filter modal
  useEffect(() => {
    api
      .get("/search/professions")
      .then((res) => setProfessions(res.data.data || []))
      .catch(() => setProfessions([]))
      .finally(() => setProfessionsLoading(false));
  }, []);

  async function loadStories(nextPage, append = false) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await api.get("/stories", {
        params: { page: nextPage, limit: PAGE_SIZE, ...feedQuery(filters) },
      });

      const data = res.data.data;
      const received = data.stories || [];

      // The feed is about other people's lives, never the reader's own. The
      // list endpoint is public, so the reader's own id is the only reliable
      // way to leave their stories out — the response doesn't carry one.
      const batch = viewerId
        ? received.filter((s) => String(s.author?._id) !== String(viewerId))
        : received;

      setStories((prev) => (append ? [...prev, ...batch] : batch));
      // "Is there another page" is about what the API returned, not about what
      // survived the filter above.
      setHasMore(received.length === PAGE_SIZE);
      setPage(nextPage);
    } catch {
      // The empty state covers a failed load.
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Reload from page 1 whenever a committed filter changes
  useEffect(() => {
    loadStories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.profession,
    filters.gender,
    filters.followingOnly,
    filters.authorName,
    viewerId,
  ]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadStories(page + 1, true);
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loading, loadingMore]);

  const appliedCount = activeFilterCount(filters);
  const isFiltered = appliedCount > 0;

  /** Opens the modal on a copy of what is currently applied. */
  function openFilters() {
    setDraft(filters);
    setFilterOpen(true);
  }

  function applyFilters() {
    setFilters(draft);
    setFilterOpen(false);
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFilterOpen(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-28 sm:px-6 md:py-10 md:pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Feed
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stories from authors across the community.
            </p>
          </div>

          <FilterButton count={appliedCount} onClick={openFilters} />
        </div>
      </motion.div>

      {loading && stories.length === 0 ? (
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <StoryCardSkeleton key={n} />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <NoDataState
          icon={Icons.book}
          title={isFiltered ? "No matching stories" : "No stories yet"}
          description={
            isFiltered
              ? "Try adjusting or clearing your filters."
              : "Stories from other authors will appear here."
          }
        />
      ) : (
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
              <p className="text-xs text-muted-foreground">Loading more...</p>
            </div>
          )}

          {!hasMore && <EndOfFeed />}
        </div>
      )}

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        draft={draft}
        professions={professions}
        professionsLoading={professionsLoading}
        onChange={setDraftFilter}
        onClear={clearFilters}
        onApply={applyFilters}
      />
    </div>
  );
}
