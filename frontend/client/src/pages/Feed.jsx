import { useEffect, useState, useRef, useCallback } from "react";
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
  const [sort, setSort] = useState("latest");
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  async function loadStories(p, append = false) {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = { limit: 10, page: p };
      if (sort !== "latest") params.sort = sort;
      const res = await api.get("/stories", { params });
      const data = res.data.data;
      const newStories = data.stories || [];

      setStories((prev) => (append ? [...prev, ...newStories] : newStories));
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
    setPage(1);
    loadStories(1);
  }, [sort]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadStories(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 select-none">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Feed
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Latest stories from the community
            </p>
          </div>

          {/* Sort filter */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Liked</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </motion.div>

      {/* Feed Content */}
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

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Spinner size="md" label="Loading more..." />
            </div>
          )}

          {/* End of feed */}
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
