import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import StoryCard from "../components/story/StoryCard";
import StoryCardSkeleton from "../components/skeletons/StoryCardSkeleton";
import Button from "../components/ui/Button";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const GENDER_OPTIONS = [
  { value: "", label: "Any gender" },
  { value: "Male", label: "Male authors" },
  { value: "Female", label: "Female authors" },
  { value: "Other", label: "Other" },
];

export default function StoryListPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [tag] = useState(searchParams.get("tag") || "");
  const [profession, setProfession] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [appliedAuthorName, setAppliedAuthorName] = useState("");
  const [gender, setGender] = useState("");
  const [followingOnly, setFollowingOnly] = useState(false);
  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(true);

  // Load profession options for the filter bar
  useEffect(() => {
    api
      .get("/search/professions")
      .then((res) => setProfessions(res.data.data || []))
      .catch(() => setProfessions([]))
      .finally(() => setProfessionsLoading(false));
  }, []);

  async function loadStories(p) {
    setLoading(true);
    try {
      const params = { limit: 20, page: p };
      if (tag) params.tag = tag;
      if (profession) params.profession = profession;
      if (appliedAuthorName) params.authorName = appliedAuthorName;
      if (gender) params.gender = gender;
      if (followingOnly && isAuthenticated) params.following = "true";

      const res = await api.get("/stories", { params });
      const data = res.data.data;
      setStories(data.stories || []);
      setPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    loadStories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, profession, appliedAuthorName, gender, followingOnly]);

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
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            Explore{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Stories
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover captivating stories from authors around the world
          </p>
        </div>
      </div>

      {/* ═══════════ Filter bar ═══════════ */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Author name — text input with apply on Enter / button */}
          <div className="relative flex-1 min-w-[200px]">
            <Icons.user className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedAuthorName(authorName.trim());
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
                {professionsLoading ? "Loading professions..." : "All professions"}
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

          {/* Following toggle (signed-in readers only) */}
          {isAuthenticated && (
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
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors lg:ml-auto"
            >
              <Icons.close className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {loading && stories.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n}>
              <StoryCardSkeleton />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<Icons.book className="h-16 w-16" />}
          title={hasActiveFilters ? "No matching stories" : "No stories found"}
          description={
            hasActiveFilters
              ? "Try adjusting or clearing your filters."
              : "Check back soon — authors are writing."
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.map((s) => (
              <StoryCard key={s._id} story={s} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => loadStories(page - 1)}>
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => loadStories(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
