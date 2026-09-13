import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Avatar from "../ui/Avatar";
import { Icons } from "../../icons";

/** Horizontal scroll of published stories from other authors. */
export default function StoriesForYou({ stories }) {
  const navigate = useNavigate();

  return (
    <div className="mb-10">
      <div className="flex items-end justify-between mb-1.5">
        <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
          Stories For You
        </h2>
        <Link
          to="/feed"
          className="text-sm font-semibold text-primary hover:text-accent transition-colors"
        >
          View all
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Experiences, lessons and journeys from other authors.
      </p>

      {stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Icons.book className="h-9 w-9 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No stories from other authors yet — check back soon.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 snap-x">
          {stories.map((s, i) => {
            const a = s.author || {};
            const firstChapter = [...(s.chapters || [])].sort(
              (x, y) => (x.order ?? 0) - (y.order ?? 0),
            )[0];
            const cover =
              s.coverImage?.url ||
              firstChapter?.coverImage?.url ||
              firstChapter?.media?.find((m) => m.type === "image")?.url ||
              firstChapter?.stories?.find((st) => st.media?.some((m) => m.type === "image"))
                ?.media.find((m) => m.type === "image")?.url;

            return (
              <motion.div
                key={s._id || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="flex-shrink-0 w-64 sm:w-72 snap-start rounded-2xl border border-border/60 bg-card shadow-xs hover:shadow-md overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
                onClick={() => navigate(`/feed/story/${s.slug}`)}
              >
                <div className="relative h-36 bg-muted">
                  {cover ? (
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icons.book className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                  )}
                  <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-card/90 flex items-center justify-center text-muted-foreground">
                    <Icons.tag className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={a.avatar?.url} name={a.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate flex items-center gap-1">
                        {a.fullName}
                        {a.verification?.status === "approved" && (
                          <Icons.verified className="h-3.5 w-3.5 text-info flex-shrink-0" />
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Chapter: {firstChapter?.title || "Life"}
                      </p>
                    </div>
                  </div>

                  <h3 className="mt-3 font-display text-base font-bold text-foreground leading-snug line-clamp-2">
                    {s.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-5 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <Icons.heartRegular className="h-4 w-4 text-accent" />
                      {s.stats?.likes || 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <Icons.chat className="h-4 w-4" />
                      {s.stats?.comments || 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs ml-auto">
                      <Icons.share className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
