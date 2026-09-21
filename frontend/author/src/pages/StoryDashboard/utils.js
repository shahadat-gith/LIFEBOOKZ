import { countWords, richTextToPlain } from "../../utils/richText";
import { sortChapters } from "../../utils/chapters";
import { bookId, storyEntryId } from "../../utils/helpers";
import { storyThumbnail } from "../../utils/media";

/**
 * Derivations behind the story dashboard.
 *
 * Everything here works off the lifebooks the author already owns, so the
 * numbers on the dashboard can never disagree with the lists beside them.
 */

/**
 * Every story entry across every lifebook, newest first, with the chapter and
 * lifebook it belongs to attached.
 */
export function flattenStories(books = []) {
  return books
    .flatMap((book) =>
      sortChapters(book.chapters).map((chapter) => ({ book, chapter })),
    )
    .flatMap(({ book, chapter }) =>
      (chapter.stories || []).map((story) => ({
        id: storyEntryId(story),
        story,
        chapter,
        book,
        status: story.status === "published" ? "published" : "draft",
        words: countWords(story.content),
        preview: richTextToPlain(story.content).replace(/\s+/g, " ").trim(),
        thumb: storyThumbnail(story, book),
        mediaCount: (story.media || []).length,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.story.updatedAt || b.story.createdAt || 0) -
        new Date(a.story.updatedAt || a.story.createdAt || 0),
    );
}

/** Headline numbers for the dashboard tiles. */
export function dashboardTotals(books = []) {
  const rows = flattenStories(books);

  return {
    lifebooks: books.length,
    published: rows.filter((r) => r.status === "published").length,
    drafts: rows.filter((r) => r.status === "draft").length,
    chapters: books.reduce((n, book) => n + (book.chapters?.length || 0), 0),
    stories: rows.length,
    likes: books.reduce((n, book) => n + (book.stats?.likes || 0), 0),
    comments: books.reduce((n, book) => n + (book.stats?.comments || 0), 0),
    media: rows.reduce((n, row) => n + (row.mediaCount || 0), 0),
  };
}

/**
 * Everyone who recently liked one of the author's lifebooks, newest first,
 * tagged with the lifebook they liked.
 */
export function recentLikers(books = [], limit = 12) {
  return books
    .flatMap((book) =>
      (book.recentLikers || []).map((liker) => ({
        key: `${bookId(book)}:${liker.user || liker.fullName}`,
        name: liker.fullName || "Someone",
        avatar: liker.avatar || null,
        book: book.title || "Untitled lifebook",
      })),
    )
    .slice(0, limit);
}
