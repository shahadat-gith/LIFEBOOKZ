import { formatDate } from "../../utils/helpers";

/**
 * Derivations for the story reader.
 *
 * Chapters no longer carry a posted date: a chapter is the phase of life a
 * story belongs to, so the date sits with the story that was posted — and
 * every story falls back through the same chain.
 */

/** When a story was posted — its publish date, else when it last changed. */
export function storyPostedAt(story) {
  return story?.publishedAt || story?.updatedAt || story?.createdAt || null;
}

/** A story's posted date, formatted with moment. */
export function formatPosted(value) {
  return value ? formatDate(value, "D MMM YYYY") : "";
}
