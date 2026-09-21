import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import FilterButton from "../../components/feed/FilterButton";
import FilterModal from "../../components/feed/FilterModal";
import NoDataState from "../../components/common/NoDataState";
import ErrorState from "../../components/common/ErrorState";
import { Icons } from "../../icons";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  feedQuery,
} from "../../utils/feedFilters";

import StoryGrid, { StoryGridSkeleton } from "./components/StoryGrid";
import Pagination from "./components/Pagination";
import { PAGE_SIZE } from "./utils";

/**
 * Explore — every published story, paged, with the same filters as the feed.
 *
 * The filters are the shared ones from `components/feed`, so this page and
 * the feed can never drift apart: the icon opens the same modal, the draft is
 * committed the same way, and the request is built by the same helper.
 */
export default function StoryListPage() {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get("tag") || "";
  const { isAuthenticated } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Committed filters drive the request; `draft` is what the modal edits.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(true);

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

  async function loadStories(nextPage) {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/stories", {
        params: {
          limit: PAGE_SIZE,
          page: nextPage,
          ...(tag ? { tag } : {}),
          ...feedQuery(filters, { canFilterFollowing: isAuthenticated }),
        },
      });

      const data = res.data.data;
      setStories(data.stories || []);
      setPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 0);
    } catch (err) {
      setStories([]);
      setError(
        err.response?.data?.error?.message ||
          "We couldn't load the stories. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Reload from page 1 whenever a committed filter changes
  useEffect(() => {
    loadStories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tag,
    filters.profession,
    filters.authorName,
    filters.gender,
    filters.followingOnly,
  ]);

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
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">
            Explore{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Stories
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover captivating stories from authors around the world
          </p>
        </div>

        <FilterButton count={appliedCount} onClick={openFilters} />
      </div>

      {loading && stories.length === 0 ? (
        <StoryGridSkeleton />
      ) : error ? (
        <ErrorState
          title="Stories didn't load"
          message={error}
          onRetry={() => loadStories(page)}
        />
      ) : stories.length === 0 ? (
        <NoDataState
          icon={Icons.book}
          title={isFiltered ? "No matching stories" : "No stories found"}
          description={
            isFiltered
              ? "Try adjusting or clearing your filters."
              : "Check back soon — authors are writing."
          }
        />
      ) : (
        <>
          <StoryGrid stories={stories} />
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={loadStories}
          />
        </>
      )}

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        draft={draft}
        professions={professions}
        professionsLoading={professionsLoading}
        canFilterFollowing={isAuthenticated}
        onChange={setDraftFilter}
        onClear={clearFilters}
        onApply={applyFilters}
      />
    </div>
  );
}
