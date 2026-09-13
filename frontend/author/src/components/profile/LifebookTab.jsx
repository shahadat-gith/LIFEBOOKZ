import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icons } from "../../icons";

const TYPE_BADGE = {
  memory: "bg-rose-500/10 text-rose-600",
  experience: "bg-blue-500/10 text-info",
  achievement: "bg-amber-400/15 text-warning",
  challenge: "bg-violet-500/10 text-violet-600",
  lesson: "bg-emerald-500/10 text-success",
  other: "bg-muted text-muted-foreground",
};

const VIS_OPTIONS = [
  { value: "public", label: "Everyone", icon: Icons.globe },
  { value: "followers", label: "Followers only", icon: Icons.user },
  { value: "private", label: "Only me", icon: Icons.lock },
];

/**
 * Lifebook tab — chapter list (default) or a chapter's stories reader
 * with a per-chapter visibility changer (top-right of the header).
 */
export default function LifebookTab({
  chapterRows,
  onAddChapter,
  onEditStory,
  onChapterVisibility,
}) {
  const [openIdx, setOpenIdx] = useState(null);

  if (openIdx !== null && chapterRows[openIdx]) {
    return (
      <ChapterStoriesView
        chapter={chapterRows[openIdx]}
        index={openIdx}
        onBack={() => setOpenIdx(null)}
        onEditStory={onEditStory}
        onChangeVisibility={(vis) =>
          onChapterVisibility(
            chapterRows[openIdx].book.id || chapterRows[openIdx].book._id,
            chapterRows[openIdx]._id || chapterRows[openIdx].id,
            vis,
          )
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      

      {chapterRows.length === 0 ? (
        <EmptyChapterState onAddChapter={onAddChapter} />
      ) : (
        <div className="space-y-3.5">
          {chapterRows.map((ch, idx) => (
            <motion.button
              key={ch._id || idx}
              type="button"
              whileTap={{ scale: 0.995 }}
              onClick={() => setOpenIdx(idx)}
              className={`w-full flex items-center gap-4 rounded-2xl border p-3 text-left shadow-xs hover:shadow-sm transition-all ${ch.tint}`}
            >
              {ch.cover ? (
                <img
                  src={ch.cover}
                  alt=""
                  className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl bg-card/70 flex items-center justify-center flex-shrink-0">
                  <Icons.book className="h-6 w-6 text-muted-foreground/60" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className={`font-display text-lg font-bold ${ch.numColor}`}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                    {ch.title || "Untitled Chapter"}
                  </h3>
                </div>
                {ch.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                    {ch.description}
                  </p>
                )}
                <p className="text-xs font-semibold text-foreground/80 mt-1">
                  {ch.storyCount} {ch.storyCount === 1 ? "Story" : "Stories"}
                </p>
              </div>

              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-card/80 border border-border/50 flex items-center justify-center font-display text-sm font-bold text-foreground">
                {ch.storyCount}
              </span>
              <Icons.chevronRight className="h-4 w-4 text-foreground/50 flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAddChapter}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-4 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
      >
        <Icons.plus className="h-4 w-4" />
        Add New Chapter
      </button>
    </div>
  );
}

/* ───────────────── Chapter reader ───────────────── */

function ChapterStoriesView({ chapter, index, onBack, onEditStory, onChangeVisibility }) {
  const stories = chapter.stories || [];
  const [visOpen, setVisOpen] = useState(false);
  const visRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (visRef.current && !visRef.current.contains(e.target)) setVisOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const currentVis =
    VIS_OPTIONS.find((v) => v.value === (chapter.visibility || "public")) || VIS_OPTIONS[0];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4 group"
      >
        <Icons.chevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All Chapters
      </button>

      <div className="flex items-start gap-4 mb-6">
        {chapter.cover ? (
          <img
            src={chapter.cover}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0 ${chapter.tint}`}
          >
            <Icons.book className="h-6 w-6 text-muted-foreground/60" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`font-display text-sm font-bold ${chapter.numColor}`}>
            Chapter {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {chapter.title || "Untitled Chapter"}
          </h2>
          {chapter.description && (
            <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
          )}
        </div>

        {/* Visibility changer (top-right) */}
        <div className="relative flex-shrink-0" ref={visRef}>
          <button
            type="button"
            onClick={() => setVisOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
            title="Change who can see this chapter"
          >
            <currentVis.icon className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">{currentVis.label}</span>
            <Icons.chevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {visOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border/80 bg-popover shadow-md p-1.5 z-20">
              <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Who can see this chapter
              </p>
              {VIS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = opt.value === currentVis.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setVisOpen(false);
                      if (!active) onChangeVisibility(opt.value);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-primary/5 text-primary font-semibold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {opt.label}
                    {active && <Icons.check className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {chapter.media?.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
          {chapter.media.map((m, i) =>
            m.type === "video" ? (
              <video
                key={i}
                src={m.url}
                controls
                className="w-full h-28 rounded-xl object-cover bg-black"
              />
            ) : (
              <img key={i} src={m.url} alt="" className="w-full h-28 rounded-xl object-cover" />
            ),
          )}
        </div>
      )}

      {stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Icons.document className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No stories in this chapter yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((s, i) => (
            <article
              key={s._id || s.id || i}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    TYPE_BADGE[s.storyType] || TYPE_BADGE.other
                  }`}
                >
                  {s.storyType || "story"}
                </span>
                {s.dateLabel && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Icons.clock className="h-3 w-3" />
                    {s.dateLabel}
                  </span>
                )}
                {s.location && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Icons.globe className="h-3 w-3" />
                    {s.location}
                  </span>
                )}
                {s.status === "published" ? (
                  <span className="ml-auto text-[10px] font-semibold text-success">Published</span>
                ) : (
                  <span className="ml-auto text-[10px] font-semibold text-warning">Draft</span>
                )}
              </div>

              <h3 className="font-display text-lg font-bold text-foreground">
                {s.title || "Untitled"}
              </h3>

              <p className="mt-2 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {s.content}
              </p>

              {s.media?.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
                  {s.media.map((m, mi) =>
                    m.type === "video" ? (
                      <video
                        key={mi}
                        src={m.url}
                        controls
                        className="w-full h-24 rounded-xl object-cover bg-black"
                      />
                    ) : (
                      <img key={mi} src={m.url} alt="" className="w-full h-24 rounded-xl object-cover" />
                    ),
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => onEditStory(chapter.book.id || chapter.book._id, s._id || s.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent transition-colors"
                >
                  <Icons.edit className="h-3.5 w-3.5" />
                  Edit Story
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChapterState({ onAddChapter }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Icons.book className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="font-display font-semibold text-foreground">Your lifebook is empty</p>
      <p className="text-sm text-muted-foreground mt-1">
        Chapters hold the stories of your life. Create your first one.
      </p>
      <button
        type="button"
        onClick={onAddChapter}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition-all"
      >
        <Icons.plus className="h-4 w-4" /> Create First Chapter
      </button>
    </div>
  );
}
