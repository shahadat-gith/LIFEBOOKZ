import { useEffect, useRef, useState } from "react";

import api from "../../../config/axios";
import { useAuth } from "../../../context/AuthContext";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  feedQuery,
} from "../../../utils/feedFilters";

const PAGE_SIZE = 10;

/**
 * Everything the feed needs that isn't markup: the stories, the paging, the
 * committed filters and the draft the modal edits.
 *
 * Filters are edited as a draft and committed in one go, so narrowing the
 * feed costs one request no matter how many controls were touched.
 */
export default function useFeed() {
  const { isAuthenticated } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(true);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  function setDraftFilter(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  // Profession options for the filter modal.
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
        params: {
          page: nextPage,
          limit: PAGE_SIZE,
          ...feedQuery(filters, { canFilterFollowing: isAuthenticated }),
        },
      });

      const batch = res.data.data?.stories || [];

      setStories((prev) => (append ? [...prev, ...batch] : batch));
      setHasMore(batch.length === PAGE_SIZE);
      setPage(nextPage);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Reload from page 1 whenever a committed filter changes.
  useEffect(() => {
    loadStories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.profession,
    filters.authorName,
    filters.gender,
    filters.followingOnly,
  ]);

  // Infinite scroll: load the next page as the sentinel comes into view.
  useEffect(() => {
    if (!sentinelRef.current) return undefined;

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

  const appliedCount = activeFilterCount(filters);

  return {
    stories,
    loading,
    loadingMore,
    hasMore,
    sentinelRef,
    appliedCount,
    isFiltered: appliedCount > 0,
    filterOpen,
    draft,
    professions,
    professionsLoading,
    setDraftFilter,
    openFilters,
    applyFilters,
    clearFilters,
    closeFilters: () => setFilterOpen(false),
  };
}
