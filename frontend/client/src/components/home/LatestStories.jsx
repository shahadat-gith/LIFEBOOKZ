import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import StoryCard from "../story/StoryCard";
import StoryCardSkeleton from "../skeletons/StoryCardSkeleton";
import { Icons } from "../../icons";
import api from "../../config/axios";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export function LatestStories() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    api
      .get("/stories", {
        params: {
          type: "latest",
        },
      })
      .then((res) => {
        if (!cancelled) {
          setStories(res.data.data.stories || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load latest stories:", err);
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
    <section
      ref={sectionRef}
      className="pt-8 pb-12 sm:pt-12 sm:pb-20 relative overflow-hidden bg-background border-t border-border/60 select-none"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 sm:mb-12 text-center sm:text-left"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-display mb-2">
              Latest Stories
            </h2>

            <p className="text-muted-foreground text-sm sm:text-base max-w-xl font-sans leading-relaxed">
              Explore the latest stories shared by our community.
            </p>
          </div>
        </motion.div>

        {!loading && stories.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-8"
          >
            {stories.slice(0, 3).map((story) => (
              <motion.div key={story._id} variants={itemVariants}>
                <StoryCard story={story} showActions={false} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && stories.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border/60 rounded-xl">
            <Icons.book className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm font-medium">
              No stories yet. Be the first to share your story!
            </p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <StoryCardSkeleton showActions={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LatestStories;