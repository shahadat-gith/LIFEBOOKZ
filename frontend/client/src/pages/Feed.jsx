import { useEffect, useState,useRef } from "react";
import { motion } from "framer-motion";
import api from "../config/axios";
import StoryCard from "../components/story/StoryCard";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function FeedPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState("latest");
  const sectionRef = useRef(null);

  async function loadStories(p, append = false) {
    setLoading(true);
    try {
      const params = { limit: 12, page: p };
      if (sort !== "latest") params.sort = sort;
      const res = await api.get("/stories", { params });
      const data = res.data.data;
      const newStories = data.stories || [];
      setStories(prev => append ? [...prev, ...newStories] : newStories);
      setHasMore(newStories.length === 12);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    loadStories(1);
  }, [sort]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadStories(next, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
      >
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display mb-3">
            Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
              Feed
            </span>
          </h1>
          <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl font-sans leading-relaxed">
            Stay updated with the latest stories from authors you love.
          </p>
        </div>

        {/* Sort filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground/70">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Liked</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </motion.div>

      {/* Stories grid */}
      {loading && stories.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading your feed..." />
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<Icons.document className="h-16 w-16" />}
          title="No stories in your feed"
          description="Follow authors to see their latest stories here."
        />
      ) : (
        <>
          <motion.div
            ref={sectionRef}
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {stories.map((story) => (
              <motion.div
                key={story._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <StoryCard story={story} />
              </motion.div>
            ))}
          </motion.div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-12">
              <button
                onClick={loadMore}
                disabled={loading}
                className="group relative rounded-full border border-border/60 px-8 py-3 text-sm font-medium text-foreground bg-background/50 backdrop-blur-sm hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Icons.spinner className="h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Load More <Icons.chevronDown className="h-4 w-4" />
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
