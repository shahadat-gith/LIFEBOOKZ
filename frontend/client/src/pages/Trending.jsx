import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../config/axios";
import StoryCard from "../components/story/StoryCard";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
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
      {/* Hero Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-border/40 pb-8"
      >
        <div className="space-y-2.5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display text-foreground">
            Trending{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">
              Stories
            </span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-xl font-sans leading-relaxed">
            The most engaging narratives across the platform right now, ranked by reader applause and thoughtful discussions.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/60 shadow-xs text-xs font-medium text-muted-foreground">
          {Icons?.trendingUp ? (
            <Icons.trendingUp className="h-4 w-4 text-accent" />
          ) : Icons?.sparkles ? (
            <Icons.sparkles className="h-4 w-4 text-accent" />
          ) : null}
          <span>Top {stories.length > 0 ? stories.length : 10} Stories</span>
        </div>
      </motion.div>

      {/* Content Section */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 items-start p-6 rounded-2xl bg-card/40 border border-border/40 animate-pulse"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted/60 rounded-md w-3/4" />
                <div className="h-3 bg-muted/40 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={
            Icons?.sparkles ? (
              <Icons.sparkles className="h-12 w-12 text-muted-foreground/50" />
            ) : null
          }
          title="No trending stories yet"
          description="Stories with active reader engagement and comments will be featured here."
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={listContainer}
          className="space-y-6"
        >
          {stories.map((story, index) => {
            const rank = String(index + 1).padStart(2, "0");
            const isTopThree = index < 3;

            return (
              <motion.div
                key={story._id}
                variants={listItem}
                className="group relative flex items-start gap-3 sm:gap-6"
              >
                {/* Main Card Container */}
                <div className="flex-1 min-w-0">
                  <StoryCard story={story} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}