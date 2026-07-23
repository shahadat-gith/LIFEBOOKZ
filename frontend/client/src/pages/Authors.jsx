import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../config/axios";
import Avatar from "../components/ui/Avatar";
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

const gridContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get("/authors/approved")
      .then((res) => {
        if (!cancelled) {
          setAuthors(res.data.data || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load authors:", err);
          setAuthors([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = authors.filter((a) =>
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.profession?.toLowerCase().includes(search.toLowerCase()) ||
    a.bio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 select-none">
      {/* Header & Controls */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border/40 pb-8"
      >
        <div className="space-y-2.5">
          

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display text-foreground">
            Meet Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">
              Authors
            </span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-xl font-sans leading-relaxed">
            Discover passionate writers, storytellers, and creators shaping the community with original narratives.
          </p>
        </div>

        {/* Minimal Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <div className="relative flex items-center">
            {Icons?.search ? (
              <Icons.search className="absolute left-3.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            ) : (
              <span className="absolute left-3.5 text-xs text-muted-foreground/60">🔍</span>
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full h-10 rounded-xl border border-border/70 bg-card/60 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-all shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-card/40 border border-border/40 animate-pulse flex flex-col items-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-muted/60" />
              <div className="h-4 bg-muted/60 rounded-md w-3/4" />
              <div className="h-3 bg-muted/40 rounded-md w-1/2" />
              <div className="h-10 bg-muted/30 rounded-md w-full mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={
            Icons?.user ? (
              <Icons.user className="h-12 w-12 text-muted-foreground/50" />
            ) : null
          }
          title={search ? "No matching authors found" : "No authors found"}
          description={
            search
              ? "Try adjusting your search criteria or clear the filter."
              : "Authors will appear here once approved by moderators."
          }
        />
      ) : (
        /* Authors Grid */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={gridContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filtered.map((author) => (
            <motion.div key={author._id} variants={cardVariant}>
              <Link
                to={`/author/${author._id}`}
                className="group relative flex flex-col h-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6 hover:border-accent/40 hover:bg-card/90 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Subtle Accent Glow on Hover */}
                <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-accent/10 blur-xl group-hover:bg-accent/20 transition-all duration-300" />

                {/* Avatar with Verified Badge */}
                <div className="flex justify-center mb-4 relative z-10">
                  <div className="relative">
                    <Avatar
                      src={author.avatar?.url}
                      name={author.fullName || "Author"}
                      size="xl"
                      className="ring-2 ring-border/40 group-hover:ring-accent/50 transition-all duration-300"
                    />
                    <div
                      className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center shadow-xs"
                      title="Verified Author"
                    >
                      {Icons?.check ? (
                        <Icons.check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <span className="text-[10px]">✓</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Author Info */}
                <div className="text-center flex-1 relative z-10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground font-display truncate group-hover:text-accent transition-colors duration-200">
                      {author.fullName || "Anonymous Author"}
                    </h3>

                    {author.profession ? (
                      <p className="text-xs font-semibold text-accent/90 mt-0.5 truncate">
                        {author.profession}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-muted-foreground/60 mt-0.5">
                        Contributor
                      </p>
                    )}

                    {author.bio && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                        {author.bio}
                      </p>
                    )}
                  </div>

                  {/* Card Footer Meta */}
                  <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-border/40 text-[11px] font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {Icons?.book ? (
                        <Icons.book className="h-3.5 w-3.5 text-accent/80" />
                      ) : null}
                      <span>
                        {author.storyCount || 0}{" "}
                        {author.storyCount === 1 ? "story" : "stories"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span>Joined</span>
                      <span className="text-foreground/80 font-sans">
                        {author.createdAt
                          ? new Date(author.createdAt).toLocaleDateString(
                              undefined,
                              { month: "short", year: "numeric" }
                            )
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}