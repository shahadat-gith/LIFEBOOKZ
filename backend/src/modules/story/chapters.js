/**
 * The chapters of a life — the structure the Life Story Structure defines.
 *
 * A chapter stores its own title, so an author's own chapter past these seven
 * is named by them. These names are what a chapter gets when it is created
 * without one (and what an older chapter falls back to on read).
 */
export const LIFE_CHAPTERS = [
  "Childhood",
  "School Life",
  "College Life",
  "Relationship / Love Life",
  "Career",
  "Marriage",
  "Family",
];

/** The default title for the chapter sitting in a given slot. */
export function chapterName(order) {
  const index = Number(order);
  return LIFE_CHAPTERS[index] || `Chapter ${index + 1}`;
}
