import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import StoryCard from "../story/StoryCard";
import { Button } from "../ui";
import { Icons } from "../../icons";
import { Link } from "react-router-dom";
import api from "../../config/axios";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
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
      className="py-24 relative overflow-hidden bg-background select-none"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16 text-center sm:text-left"
        >
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-display mb-3">
              Latest{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
                Stories
              </span>
            </h2>

            <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl font-sans leading-relaxed">
              {loading
                ? "Loading stories..."
                : stories.length === 0
                  ? "No stories available yet. Check back soon!"
                  : "Explore the latest stories shared by our community."}
            </p>
          </div>

          <Link to="/stories" className="shrink-0 flex justify-center">
            <Button
              variant="outline"
              className="group relative rounded-full border-border/80 px-5 text-xs font-semibold tracking-wide text-foreground bg-background/50 backdrop-blur-md hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 shadow-sm"
            >
              View All Stories
              <Icons.book className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Button>
          </Link>
        </motion.div>

        {!loading && stories.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
          >
            {stories.slice(0,3).map((story) => (
              <motion.div key={story._id} variants={itemVariants}>
                <StoryCard story={story} showCommentSection={false} showReadMore={false}/>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && stories.length === 0 && (
          <div className="text-center py-16">
            <Icons.book className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground/60 text-sm">
              No stories yet. Be the first to share your story!
            </p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-xl bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LatestStories;
