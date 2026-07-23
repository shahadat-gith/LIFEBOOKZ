import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import api from "../config/axios";
import StoryCard from "../components/story/StoryCard";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

export default function FeedPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const handleSearch = () => {
    // TODO: Implement story search
    console.log("Search:", search);
  };

  async function loadStories(p, append = false) {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get("/stories", {
        params: {
          page: p,
          limit: 10,
        },
      });

      const data = res.data.data;
      const newStories = data.stories || [];

      setStories((prev) =>
        append ? [...prev, ...newStories] : newStories
      );
      setHasMore(newStories.length === 10);
      setPage(p);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadStories(1);
  }, []);

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
  }, [page, hasMore, loading, loadingMore]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 select-none">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover the latest stories shared by our community.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Icons.search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search stories..."
            className="w-full rounded-xl border border-border/60 bg-card pl-11 pr-12 py-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
          >
            <Icons.search className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {loading && stories.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading feed..." />
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<Icons.document className="h-16 w-16" />}
          title="No stories yet"
          description="Be the first to explore stories from the community."
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