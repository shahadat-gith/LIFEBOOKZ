import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../config/axios";
import StoryCard from "../components/story/StoryCard";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};


export default function TrendingPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/stories", { params: { limit: 20, sort: "popular" } })
      .then((res) => {
        if (!cancelled) {
          const data = res.data.data;
          setStories(data.stories || []);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load trending:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            <span className="inline-flex items-center gap-3">
              <Icons.sparkles className="h-8 w-8 text-accent" />
              Trending{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
                Stories
              </span>
            </span>
          </h1>
          <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl font-sans leading-relaxed">
            Discover the most popular stories loved by readers across the
            community.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 bg-muted/30 px-3 py-1.5 rounded-full">
            <Icons.sparkles className="h-3 w-3 text-accent" />
            Popular this week
          </span>
        </div>
      </motion.div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading trending stories..." />
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<Icons.sparkles className="h-16 w-16" />}
          title="No trending stories yet"
          description="Stories with the most engagement will appear here."
        />
      ) : (
        <div className="space-y-12">
          {/* Top 3 Podium */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {stories.slice(0, 3).map((story, index) => (
              <motion.div
                key={story._id}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  },
                }}
                className="relative group"
              >
                <div className="p-5">
                  <StoryCard story={story} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Remaining stories */}
          {stories.length > 3 && (
            <>
              <div className="relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground/80 mb-6 font-display">
                  More Trending Stories
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.slice(3).map((story, index) => (
                    <motion.div
                      key={story._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 * index }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-muted-foreground/30 mt-1 w-5 shrink-0">
                          #{index + 4}
                        </span>
                        <div className="flex-1">
                          <StoryCard story={story} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
