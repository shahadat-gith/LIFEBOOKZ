import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../config/axios";
import StoryCard from "../components/story/StoryCard";
import StoryCardSkeleton from "../components/skeletons/StoryCardSkeleton";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function TrendingPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get("/stories", { params: { type: "trending" } })
      .then((res) => {
        if (!cancelled) {
          setStories(res.data.data.stories || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load trending stories:", err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 select-none">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex flex-col justify-between gap-3 mb-10 border-b border-border/60 pb-8"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display text-foreground">
          Trending Stories
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base max-w-xl font-sans leading-relaxed">
          The most engaging narratives across the platform right now, calculated by reader interactions and community engagement.
        </p>
      </motion.div>

      {/* Content Section */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <StoryCardSkeleton />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={
            Icons?.sparkles ? (
              <Icons.sparkles className="h-10 w-10 text-muted-foreground/40" />
            ) : null
          }
          title="No trending stories yet"
          description="Stories with active reader engagement and discussions will be featured here."
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={listContainer}
          className="space-y-6"
        >
          {stories.map((story) => (
            <motion.div
              key={story._id}
              variants={listItem}
              className="group relative"
            >
              <StoryCard story={story} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}