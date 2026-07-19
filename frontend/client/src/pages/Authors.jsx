import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../config/axios";
import Avatar from "../components/ui/Avatar";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
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
    return () => { cancelled = true; };
  }, []);

  const filtered = authors.filter((a) =>
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.profession?.toLowerCase().includes(search.toLowerCase()) ||
    a.bio?.toLowerCase().includes(search.toLowerCase())
  );

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
            Meet Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
              Authors
            </span>
          </h1>
          <p className="text-muted-foreground/90 text-sm sm:text-base max-w-xl font-sans leading-relaxed">
            Discover talented storytellers from across the LifeBookz community.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto shrink-0">
          <div className="relative">
            <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search authors..."
              className="w-full sm:w-64 h-10 rounded-full border border-border/60 bg-muted/20 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:bg-background transition-all duration-300"
            />
          </div>
        </div>
      </motion.div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading authors..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Icons.user className="h-16 w-16" />}
          title={search ? "No authors match your search" : "No authors yet"}
          description={search ? "Try a different name or keyword." : "Authors will appear here once they join and get approved."}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filtered.map((author, index) => (
            <motion.div
              key={author._id}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.98 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <div className="group block h-full">
                <div className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5">
                  {/* Hover gradient accent */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Avatar */}
                  <div className="flex justify-center mb-5">
                    <div className="relative">
                      <Avatar
                        src={author.avatar?.url}
                        name={author.fullName}
                        size="xl"
                      />
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-card flex items-center justify-center">
                        <Icons.check className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h3 className="text-base font-semibold text-foreground font-display truncate group-hover:text-primary transition-colors duration-200">
                      {author.fullName || "Unknown Author"}
                    </h3>
                    {author.profession && (
                      <p className="text-xs font-medium text-muted-foreground/70 mt-0.5 truncate">
                        {author.profession}
                      </p>
                    )}
                    {author.bio && (
                      <p className="text-xs text-muted-foreground/60 mt-3 line-clamp-2 leading-relaxed">
                        {author.bio}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[11px]">
                      <Icons.book className="h-3.5 w-3.5" />
                      <span>{author.storyCount || 0} stories</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[11px]">
                      <Icons.clock className="h-3.5 w-3.5" />
                      <span>
                        {author.createdAt
                          ? new Date(author.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
                          : "New"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
