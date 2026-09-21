import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import api from "../config/api";
import StoryCard from "../components/story/StoryCard";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const GENDER_OPTIONS = [
  { value: "", label: "Any gender" },
  { value: "Male", label: "Male authors" },
  { value: "Female", label: "Female authors" },
  { value: "Other", label: "Other" },
];

/**
 * Feed — published stories from other authors, with the same filter
 * bar as the client portal: author name, profession, author gender,
 * and a "Following" toggle.
 */
export default function Feed() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [profession, setProfession] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [appliedAuthorName, setAppliedAuthorName] = useState("");
  const [gender, setGender] = useState("");
  const [followingOnly, setFollowingOnly] = useState(false);
  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(true);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Load profession options for the filter bar
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
      const params = { page: p, limit: 10 };
      if (profession) params.profession = profession;
      if (appliedAuthorName) params.authorName = appliedAuthorName;
      if (gender) params.gender = gender;
      if (followingOnly) params.following = "true";

      const res = await api.get("/stories", { params });
      const data = res.data.data;
      const newStories = (data.stories || []).filter(
        (s) => String(s.author?._id) !== String(data.viewerId || ""),
      );
      setStories((prev) => (append ? [...prev, ...newStories] : newStories));
      setHasMore(newStories.length === 10);
      setPage(p);
    } catch {
      // silently fail — the empty state covers it
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Reload from page 1 whenever a filter changes
  useEffect(() => {
    loadStories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profession, appliedAuthorName, gender, followingOnly]);

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

  const hasActiveFilters =
    Boolean(profession) ||
    Boolean(appliedAuthorName) ||
    Boolean(gender) ||
    followingOnly;

  function clearFilters() {
    setProfession("");
    setAuthorName("");
    setAppliedAuthorName("");
    setGender("");
    setFollowingOnly(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-10 pb-28 md:pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Feed
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stories from authors across the community.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.close className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* ═══════════ Filter bar ═══════════ */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Author name — text input, applies on Enter */}
            <div className="relative flex-1 min-w-[200px]">
              <Icons.user className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    setAppliedAuthorName(authorName.trim());
                }}
                placeholder="Filter by author name"
                className="w-full rounded-xl border border-border/60 bg-background pl-11 pr-10 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {authorName && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthorName("");
                    setAppliedAuthorName("");
                  }}
                  aria-label="Clear author name"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icons.close className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Profession */}
            <div className="relative lg:w-56">
              <Icons.briefcase className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                aria-label="Filter by author profession"
                className="w-full cursor-pointer appearance-none rounded-xl border border-border/60 bg-background pl-11 pr-10 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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

            {/* Gender */}
            <div className="relative lg:w-44">
              <Icons.user className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                aria-label="Filter by author gender"
                className="w-full cursor-pointer appearance-none rounded-xl border border-border/60 bg-background pl-11 pr-10 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <Icons.chevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Following toggle */}
            <button
              type="button"
              onClick={() => setFollowingOnly((f) => !f)}
              aria-pressed={followingOnly}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                followingOnly
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icons.heartRegular className="h-4 w-4" />
              Following
            </button>
          </div>
        </div>
      </motion.div>

      {loading && stories.length === 0 ? (
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-border/60 bg-card overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-5 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<Icons.book className="h-16 w-16" />}
          title={hasActiveFilters ? "No matching stories" : "No stories yet"}
          description={
            hasActiveFilters
              ? "Try adjusting or clearing your filters."
              : "Stories from other authors will appear here."
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
              <p className="text-xs text-muted-foreground">Loading more...</p>
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
