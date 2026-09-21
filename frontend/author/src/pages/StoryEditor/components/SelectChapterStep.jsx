import { useState } from "react";
import { motion } from "framer-motion";
import { Icons } from "../../../icons";
import { WizardShell } from "./WizardShell";
import {
  LIFE_CHAPTERS,
  chapterHint,
  chapterLabel,
  chapterTitle,
  findChapter,
  nextChapterOrder,
  sortChapters,
  suggestedTitle,
} from "../../../utils/chapters";

/**
 * Step 1 — which chapter does this story belong to?
 *
 * The seven chapters of a life are always offered; picking one the lifebook
 * has not reached yet creates that chapter, named after the slot. A chapter
 * of the author's own can be added with any name they like.
 */
export default function SelectChapterStep({
  chapters = [],
  onPick,
  onAddChapter,
  onBack,
}) {
  const sorted = sortChapters(chapters);
  const nextOrder = nextChapterOrder(sorted);
  const [naming, setNaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Chapters past the seven slots are the author's own additions.
  const extras = sorted.filter(
    (ch) => Number(ch.order) >= LIFE_CHAPTERS.length,
  );

  function addChapter() {
    const title = newTitle.trim() || suggestedTitle(nextOrder);
    onAddChapter(title);
  }

  return (
    <WizardShell step={1} totalSteps={9} title="My Lifebook" onBack={onBack}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Select Chapter
      </p>

      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl font-bold leading-snug text-foreground">
          Which chapter is this
          <br />
          story part of?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a chapter of your life
          <br />
          or add your own.
        </p>
      </div>

      <div className="space-y-3">
        {LIFE_CHAPTERS.map((_, order) => {
          const chapter = findChapter(sorted, order);
          const title = chapter
            ? chapterTitle(chapter)
            : suggestedTitle(order);
          const count = chapter?.stories?.length || 0;

          return (
            <ChapterRow
              key={order}
              order={order}
              title={title}
              count={count}
              cover={chapter ? chapterCover(chapter) : null}
              hint={chapter ? "" : chapterHint(order)}
              onClick={() => onPick(order)}
            />
          );
        })}

        {extras.map((chapter) => (
          <ChapterRow
            key={chapter._id || chapter.id || chapter.order}
            order={Number(chapter.order)}
            title={chapterTitle(chapter)}
            count={chapter.stories?.length || 0}
            cover={chapterCover(chapter)}
            hint=""
            onClick={() => onPick(Number(chapter.order))}
          />
        ))}

        {naming ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/40 bg-primary/5 p-4"
          >
            <label
              htmlFor="new-chapter-title"
              className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Chapter name
            </label>
            <input
              id="new-chapter-title"
              type="text"
              value={newTitle}
              autoFocus
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addChapter();
                if (e.key === "Escape") setNaming(false);
              }}
              placeholder={suggestedTitle(nextOrder)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={addChapter}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
              >
                <Icons.plus className="h-4 w-4" />
                Add chapter
              </button>
              <button
                type="button"
                onClick={() => setNaming(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => setNaming(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Icons.plus className="h-4 w-4" />
            Add Another Chapter
          </motion.button>
        )}
      </div>
    </WizardShell>
  );
}

/** The picture that stands for a chapter — the first photo in its stories. */
function chapterCover(chapter) {
  return (
    (chapter?.stories || [])
      .flatMap((story) => story.media || [])
      .find((media) => media.type === "image")?.url || null
  );
}

function ChapterRow({ order, title, count, cover, hint, onClick }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 text-left shadow-xs transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm"
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Icons.book className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">
          {chapterLabel({ order, title })}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {count > 0
            ? `${count} ${count === 1 ? "Story" : "Stories"}`
            : hint || "Nothing written yet"}
        </p>
      </div>

      <Icons.chevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </motion.button>
  );
}
