import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icons } from "../../../icons";
import RichText from "../../../components/common/RichText";
import StoryTypeBadge from "../../../components/common/StoryTypeBadge";
import NoDataState from "../../../components/common/NoDataState";
import { VISIBILITY_OPTIONS, visibilityOption } from "../../../utils/visibility";

/**
 * Lifebook tab — chapter list (default) or a chapter's stories reader.
 *
 * Visibility belongs to each story, so it is changed on the story itself
 * rather than on the chapter it happens to sit in.
 */
export default function LifebookTab({
  chapterRows,
  onAddChapter,
  onEditStory,
  onDeleteStory,
  onStoryVisibility,
  onRenameChapter,
}) {
  const [openId, setOpenId] = useState(null);
  const openChapter = chapterRows.find(
    (ch) => (ch._id || ch.id) === openId,
  );

  if (openChapter) {
    return (
      <ChapterStoriesView
        chapter={openChapter}
        onBack={() => setOpenId(null)}
        onEditStory={onEditStory}
        onDeleteStory={onDeleteStory}
        onChangeStoryVisibility={(storyEntryId, vis) =>
          onStoryVisibility(openChapter.book, openChapter, storyEntryId, vis)
        }
        onRename={(title) =>
          onRenameChapter(openChapter.book, openChapter, title)
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
          {chapterRows.map((ch) => (
            <motion.button
              key={ch._id || ch.id || ch.order}
              type="button"
              whileTap={{ scale: 0.995 }}
              onClick={() => setOpenId(ch._id || ch.id)}
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
                    {String(ch.number).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                    {ch.name}
                  </h3>
                </div>
                {ch.hint && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                    {ch.hint}
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

function ChapterStoriesView({
  chapter,
  onBack,
  onEditStory,
  onDeleteStory,
  onChangeStoryVisibility,
  onRename,
}) {
  const stories = chapter.stories || [];
  // Removing a story asks for confirmation inline, so nothing is lost to a
  // stray tap.
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function handleRemove(storyId) {
    setDeletingId(storyId);
    try {
      await onDeleteStory(chapter.book, chapter, storyId);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

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
            Chapter {String(chapter.number).padStart(2, "0")}
          </p>
          <ChapterTitle title={chapter.name} onRename={onRename} />
          {chapter.hint && (
            <p className="text-sm text-muted-foreground mt-1">{chapter.hint}</p>
          )}
        </div>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Icons.document className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No stories in this chapter yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((s, i) => {
            const storyId = s._id || s.id;
            const confirming = confirmId === storyId;
            const deleting = deletingId === storyId;

            return (
            <article
              key={storyId || i}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StoryTypeBadge type={s.storyType} />
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

              <RichText
                content={s.content}
                className="mt-2 text-sm text-foreground/90 leading-relaxed"
              />

              <MediaGallery media={s.media} className="mt-4" heightClass="h-24" />

              <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEditStory(chapter.book, storyId)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent transition-colors"
                  >
                    <Icons.edit className="h-3.5 w-3.5" />
                    Edit Story
                  </button>

                  <StoryVisibility
                    value={s.visibility || "public"}
                    onChange={(next) => onChangeStoryVisibility(storyId, next)}
                  />
                </div>

                {confirming ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-destructive">
                      Remove this story?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(storyId)}
                      disabled={deleting}
                      className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {deleting ? (
                        <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Icons.trash className="h-3.5 w-3.5" />
                      )}
                      {deleting ? "Removing…" : "Yes, remove"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      disabled={deleting}
                      className="rounded-full border border-border/70 px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      Keep it
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(storyId)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive/80 hover:text-destructive transition-colors"
                    title="Remove this story from the chapter"
                  >
                    <Icons.trash className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * The chapter's title, which the author can rename — a chapter carries its
 * own name, apart from the slot it holds in the life story structure.
 */
function ChapterTitle({ title, onRename }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  function save() {
    setEditing(false);
    onRename(value);
  }

  if (!editing) {
    return (
      <div className="group flex items-center gap-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => {
            setValue(title);
            setEditing(true);
          }}
          title="Rename this chapter"
          aria-label="Rename this chapter"
          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icons.edit className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-0.5">
      <input
        type="text"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full max-w-xs rounded-xl border border-primary/50 bg-card px-3 py-1.5 font-display text-lg font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-110"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Who can read one story. Visibility is a story's own setting — every story
 * in a chapter can be shared with a different audience.
 */
function StoryVisibility({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const current = visibilityOption(value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Change who can see this story"
        aria-label="Change who can see this story"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted"
      >
        <current.icon className="h-3.5 w-3.5 text-primary" />
        <span>{current.shortLabel}</span>
        <Icons.chevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-48 rounded-xl border border-border/80 bg-popover p-1.5 shadow-md">
          <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Who can see this story
          </p>
          {VISIBILITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = opt.value === current.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!active) onChange(opt.value);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/5 font-semibold text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {opt.label}
                {active && <Icons.check className="ml-auto h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Story media.
 *
 * One photo or video spans the full width — it's the story's picture, not a
 * thumbnail. Several fall back to a compact grid.
 */
function MediaGallery({ media, className = "", heightClass = "h-28" }) {
  const items = media || [];
  if (items.length === 0) return null;

  const [only] = items;
  if (items.length === 1) {
    return only.type === "video" ? (
      <video
        src={only.url}
        controls
        className={`w-full max-h-[26rem] rounded-xl bg-black ${className}`}
      />
    ) : (
      <img
        src={only.url}
        alt={only.caption || "Story media"}
        className={`w-full max-h-[26rem] rounded-xl object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`grid grid-cols-3 sm:grid-cols-4 gap-2 ${className}`}>
      {items.map((m, i) =>
        m.type === "video" ? (
          <video
            key={i}
            src={m.url}
            controls
            className={`w-full ${heightClass} rounded-xl object-cover bg-black`}
          />
        ) : (
          <img
            key={i}
            src={m.url}
            alt={m.caption || "Story media"}
            className={`w-full ${heightClass} rounded-xl object-cover`}
          />
        ),
      )}
    </div>
  );
}

function EmptyChapterState({ onAddChapter }) {
  return (
    <NoDataState variant="panel"
      icon={Icons.book}
      title="Your lifebook is empty"
      description="Chapters hold the stories of your life. Create your first one."
      action={{
        label: "Create First Chapter",
        icon: Icons.plus,
        onClick: onAddChapter,
      }}
    />
  );
}
