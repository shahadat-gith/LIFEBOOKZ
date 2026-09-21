/**
 * The chapters of a life.
 *
 * A chapter stores its own title and the slot it holds in the life story
 * structure (`order`, 0 = Childhood … 6 = Family). The names below are what a
 * chapter is called when it doesn't carry one of its own yet — the offer the
 * writing flow makes, and the fallback for a chapter whose slot is known.
 */

export const LIFE_CHAPTERS = [
  { name: "Childhood", hint: "Early memories, family, first adventures" },
  { name: "School Life", hint: "School days, teachers, friends" },
  { name: "College Life", hint: "Campus, achievements, friendships" },
  {
    name: "Relationship / Love Life",
    hint: "First love, memorable moments",
  },
  { name: "Career", hint: "Jobs, milestones, lessons at work" },
  { name: "Marriage", hint: "Partner, wedding, life together" },
  { name: "Family", hint: "Parents, siblings, children, traditions" },
];

/** Accepts a chapter object, or just its slot number. */
function slotOf(source) {
  if (typeof source === "number") return { order: source, title: "" };
  return {
    order: Number(source?.order ?? 0) || 0,
    title: typeof source?.title === "string" ? source.title.trim() : "",
  };
}

/** 1-based chapter number as shown to readers ("Chapter 3"). */
export function chapterNumber(order) {
  const n = Number(order);
  return Number.isFinite(n) ? n + 1 : 1;
}

/** The chapter's own title, or the name of the slot it sits in. */
export function chapterTitle(chapter) {
  const { order, title } = slotOf(chapter);
  if (title) return title;
  return LIFE_CHAPTERS[order]?.name || `Chapter ${order + 1}`;
}

/** Number and title together: "Chapter 3 - College Life". */
export function chapterLabel(chapter) {
  const { order } = slotOf(chapter);
  const number = `Chapter ${chapterNumber(order)}`;
  const title = chapterTitle(chapter);
  return title === number ? number : `${number} - ${title}`;
}

/** A one-line description of what belongs in a slot. */
export function chapterHint(order) {
  return LIFE_CHAPTERS[Number(order)]?.hint || "";
}

/** The name to offer for a chapter not written yet. */
export function suggestedTitle(order) {
  return LIFE_CHAPTERS[Number(order)]?.name || `Chapter ${chapterNumber(order)}`;
}

export function sortChapters(chapters = []) {
  return [...chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** The chapter sitting in a given slot, if the lifebook has one. */
export function findChapter(chapters = [], order) {
  return chapters.find((ch) => Number(ch.order) === Number(order)) || null;
}

/** The next free slot after the chapters a lifebook already holds. */
export function nextChapterOrder(chapters = []) {
  return chapters.reduce((max, ch) => Math.max(max, Number(ch.order) + 1), 0);
}

/** Stories in a lifebook, across every chapter. */
export function countStories(chapters = []) {
  return chapters.reduce((sum, ch) => sum + (ch.stories?.length || 0), 0);
}
