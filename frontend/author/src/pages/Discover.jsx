import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import LoadingScreen from "../components/common/LoadingScreen";
import { Icons } from "../icons";

/**
 * Discover — browse published lifebooks from the community,
 * filter by profession, or jump straight into writing.
 */
export default function Discover() {
  const navigate = useNavigate();
  const { author } = useAuth();

  const [stories, setStories] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [activeProfession, setActiveProfession] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/search/professions")
      .then((res) => setProfessions(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = activeProfession ? { profession: activeProfession } : {};
    api
      .get("/stories", { params: { ...params, limit: 24 } })
      .then((res) =>
        setStories(
          (res.data.data?.stories || []).filter(
            (s) => String(s.author?._id) !== String(author?.id || author?._id || ""),
          ),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeProfession, author]);

  const canWrite = !!author?.isProfileCompleted;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-10 pb-28 md:pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Stories For You
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Experiences, lessons and journeys from other authors.
        </p>
      </motion.div>

      {/* Profession filter chips */}
      {professions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveProfession("")}
            className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeProfession === ""
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {professions.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setActiveProfession(p.value)}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeProfession === p.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
              <span className="ml-1.5 opacity-60">{p.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Write CTA */}
      {canWrite && (
        <button
          type="button"
          onClick={() => navigate("/stories/new")}
          className="w-full mb-6 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left hover:bg-primary/10 transition-colors"
        >
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-foreground flex-shrink-0">
            <Icons.plus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">
              Share your own story
            </p>
            <p className="text-xs text-muted-foreground">
              Start the story-writing wizard
            </p>
          </div>
          <Icons.chevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
        </button>
      )}

      {/* Grid */}
      {loading ? (
        <LoadingScreen message="Loading stories..." />
      ) : stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Icons.search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-display font-semibold text-foreground">
            No stories from other authors yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different profession filter — or be the first to write.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s, i) => {
            const a = s.author || {};
            const cover =
              s.coverImage?.url ||
              s.chapters?.find((ch) => ch.coverImage?.url)?.coverImage?.url;
            const storyCount = (s.chapters || []).reduce(
              (sum, ch) => sum + (ch.stories?.length || 0),
              0,
            );
            return (
              <motion.div
                key={s._id || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-border/60 bg-card shadow-xs hover:shadow-sm overflow-hidden cursor-pointer"
                onClick={() => navigate(`/feed/story/${s.slug}`)}
              >
                {cover && (
                  <img
                    src={cover}
                    alt=""
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-display font-bold text-foreground line-clamp-2 leading-snug">
                    {s.title}
                  </h3>
                  {s.summary && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {s.summary}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2.5">
                    <Avatar
                      src={a.avatar?.url}
                      name={a.fullName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                        {a.fullName}
                        {a.verification?.status === "approved" && (
                          <Icons.verified className="h-3 w-3 text-info" />
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {storyCount} stories
                      </p>
                    </div>
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
