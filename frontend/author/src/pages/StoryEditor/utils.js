import * as storyApi from "../../utils/storyApi";
import { sortChapters, suggestedTitle } from "../../utils/chapters";

/**
 * Shape conversions for the writing wizard.
 *
 * The wizard edits a lifebook as local state and the API stores it as
 * chapter slots holding story entries. These are the two directions of that
 * mapping — kept together so the wizard's index file is about the flow and
 * not about field lists.
 */

/** A blank story, with the defaults the API understands. */
export function emptyStory() {
  return {
    title: "",
    storyType: "experience",
    content: "",
    dateLabel: "",
    location: "",
    media: [],
    // Visibility is the story's own — there is no chapter level to inherit
    // from any more.
    visibility: "public",
    status: "draft",
  };
}

/** A chapter is a titled slot in the life story structure, holding stories. */
export function emptyChapter(order, title) {
  const slot = Number(order) || 0;
  return { order: slot, title: title || suggestedTitle(slot), stories: [] };
}

/**
 * One story entry in the shape the API stores: no local-only `id` keys, and
 * a visibility that is always one of the three levels.
 */
export function toStoryEntry(story = {}) {
  const id = story.id || story._id;

  return {
    ...(id ? { _id: id } : {}),
    title: story.title || "",
    storyType: story.storyType || "experience",
    content: story.content || "",
    dateLabel: story.dateLabel || "",
    location: story.location || "",
    media: story.media || [],
    visibility: story.visibility || "public",
    status: story.status === "published" ? "published" : "draft",
  };
}

/** Chapters as the wizard holds them: sorted by slot, with local ids. */
export function toLocalChapters(chapters) {
  return sortChapters(chapters || []).map((chapter) => ({
    ...chapter,
    order: Number(chapter.order) || 0,
    id: chapter._id || chapter.id,
    stories: (chapter.stories || []).map((story) => ({
      ...story,
      id: story._id || story.id,
    })),
  }));
}

/**
 * The most recently touched unpublished story across a lifebook.
 *
 * Used when an author returns from completing their profile: the wizard
 * reopens the draft they were about to publish instead of a blank page.
 */
export function latestDraft(chapters = []) {
  let best = null;

  chapters.forEach((chapter) => {
    (chapter.stories || []).forEach((story) => {
      if (story.status === "published") return;

      const touched = new Date(
        story.updatedAt || story.createdAt || 0,
      ).getTime();

      if (!best || touched >= best.touched) {
        best = { chapter, story, touched };
      }
    });
  });

  return best;
}

/**
 * The author's existing lifebook, so `/stories/new` appends to it rather
 * than creating a second one.
 */
export async function findExistingLifebook() {
  const mine = await storyApi.getMyStories();
  return (mine || []).find((book) => (book.chapters || []).length > 0) || null;
}
