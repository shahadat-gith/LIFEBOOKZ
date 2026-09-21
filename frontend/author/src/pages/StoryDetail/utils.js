import moment from "moment";

/**
 * Date helpers for the story reader.
 *
 * Formatting goes through moment so a posted date reads the same everywhere.
 * Only stories carry one — a chapter is just the phase of life a story
 * belongs to, so the date sits with the story that was actually posted.
 */

/** A posted date as it is shown beside a story: "5 Sep 2026". */
export function formatPosted(value) {
  if (!value) return "";
  const date = moment(value);
  return date.isValid() ? date.format("D MMM YYYY") : "";
}

/** When a story was posted — its publish date, else when it last changed. */
export function storyPostedAt(story) {
  return story?.publishedAt || story?.updatedAt || story?.createdAt || null;
}
