import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import api from "../config/axios";
import StoryCard from "../components/story/StoryCard";
import StoryCardSkeleton from "../components/skeletons/StoryCardSkeleton";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

export default function FeedPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Search + filters
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState(""); // applied search query
  const [profession, setProfession] = useState(""); // applied profession filter
  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(true);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Load profession options for the filter box
  useEffect(() => {
    api
      .get("/search/professions")
      .then((res) => setProfessions(res.data.data || []))
      .catch(() => setProfessions([]))
      .finally(() => setProfessionsLoading(false));
  }, []);

  async function loadStories(p, append = false) {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const hasQuery = Boolean(query.trim());

      const params = {
        page: p,
        limit: hasQuery ? 30 : 10,
      };
      if (hasQuery) params.q = query.trim();
      if (profession) params.profession = profession;

      // Search endpoint when a query is present, otherwise browse feed
      const endpoint = hasQuery ? "/search" : "/stories";
      const res = await api.get(endpoint, { params });

      const data = res.data.data;
      const newStories = (hasQuery ? data.results : data.stories) || [];

      setStories((prev) =>
        append ? [...prev, ...newStories] : newStories
      );
      setHasMore(!hasQuery && newStories.length === 10);
      setPage(p);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Reload from page 1 whenever the applied search or profession filter changes
  useEffect(() => {
    loadStories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, profession]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !loadingMore
        ) {
          loadStories(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loading, loadingMore]);

  const handleSearch = () => {
    const nextQuery = searchInput.trim();
    if (nextQuery === query) return;
    // Clear previous results so the "Searching..." state is visible
    setStories([]);
    setQuery(nextQuery);
  };

  const handleProfessionChange = (e) => {
    setProfession(e.target.value);
  };

  const hasActiveFilters = Boolean(query) || Boolean(profession);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 select-none">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-display">
              Feed
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover the latest stories shared by our community.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setQuery("");
                setProfession("");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.close className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xl">
            <Icons.search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search stories by meaning... (e.g. 'a mother's sacrifice')"
              className="w-full rounded-xl border border-border/60 bg-card pl-11 pr-12 py-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            >
              <Icons.search className="h-4 w-4" />
            </button>
          </div>

          {/* Filter by author profession */}
          <div className="relative sm:w-72">
            <Icons.briefcase className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <select
              value={profession}
              onChange={handleProfessionChange}
              aria-label="Filter by author profession"
              className="w-full cursor-pointer appearance-none rounded-xl border border-border/60 bg-card pl-11 pr-10 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">
                {professionsLoading
                  ? "Loading professions..."
                  : "All professions"}
              </option>
              {professions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                  {p.count ? ` (${p.count})` : ""}
                </option>
              ))}
            </select>

            <Icons.chevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {query && (
          <p className="text-xs text-muted-foreground">
            Search results for{" "}
            <span className="font-semibold text-foreground">"{query}"</span>
            {profession ? (
              <>
                {" "}· filtered by{" "}
                <span className="font-semibold text-foreground">
                  {professions.find((p) => p.value === profession)?.label ||
                    profession}
                </span>
              </>
            ) : null}
          </p>
        )}
      </motion.div>

      {loading && stories.length === 0 ? (
        query ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" label="Searching..." />
          </div>
        ) : (
          <div className="space-y-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <StoryCardSkeleton key={n} />
            ))}
          </div>
        )
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<Icons.document className="h-16 w-16" />}
          title={hasActiveFilters ? "No matching stories" : "No stories yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or profession filter."
              : "Be the first to explore stories from the community."
          }
        />
      ) : (
        <div className="space-y-5">
          {stories.map((story, idx) => (
            <motion.div
              key={story._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
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

          {!hasMore && stories.length > 0 && (
            <div className="flex justify-center py-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <div className="h-px w-8 bg-border" />
                <span>You've reached the end</span>
                <div className="h-px w-8 bg-border" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
