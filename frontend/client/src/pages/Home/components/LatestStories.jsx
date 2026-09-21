import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import StoryTile from "./StoryTile";
import { Icons } from "../../../icons";
import api from "../../../config/axios";

function SkeletonTile() {
  return (
    <div className="w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm sm:w-[340px] animate-pulse">
      <div className="h-44 w-full bg-foreground/8 sm:h-48" />
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-full bg-foreground/10" />
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-md bg-foreground/10" />
            <div className="h-2.5 w-20 rounded-md bg-foreground/8" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-11/12 rounded-md bg-foreground/10" />
          <div className="h-4 w-2/3 rounded-md bg-foreground/8" />
        </div>
        <div className="mt-5 flex items-center gap-4 border-t border-border/60 pt-3">
          <div className="h-3.5 w-14 rounded-md bg-foreground/8" />
          <div className="h-3.5 w-12 rounded-md bg-foreground/8" />
          <div className="h-3.5 w-10 rounded-md bg-foreground/8" />
        </div>
      </div>
    </div>
  );
}

export function LatestStories() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

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

  const displayStories = stories.slice(0, 8);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-border/60 bg-background py-14 select-none sm:py-24"
    >
      {/* Soft wash behind the section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-accent/[0.04] via-accent/[0.01] to-transparent"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div className="text-center sm:text-left">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Stories from real lives
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Discover experiences, lessons and journeys.
            </p>
          </div>

          <Link
            to="/feed"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-accent"
          >
            View all
            <Icons.arrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Story rail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mt-8 sm:mt-10"
        >
          {loading ? (
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              {[1, 2, 3].map((n) => (
                <SkeletonTile key={n} />
              ))}
            </div>
          ) : displayStories.length > 0 ? (
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:gap-5">
              {displayStories.map((story, idx) => (
                <div
                  key={story._id}
                  className="shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <StoryTile story={story} />
                </div>
              ))}

              {/* "View all" spacer tile at the end of the rail */}
              <Link
                to="/feed"
                className="group flex w-[180px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-accent/35 bg-accent/[0.04] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:bg-accent/[0.07] sm:w-[200px]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform group-hover:scale-110">
                  <Icons.arrowRight className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-accent">
                  Explore all stories
                </span>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center">
              <Icons.book className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No stories yet. Be the first to share your story!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default LatestStories;
