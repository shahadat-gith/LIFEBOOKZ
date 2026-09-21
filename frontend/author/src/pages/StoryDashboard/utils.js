import { countWords, richTextToPlain } from "./richText";

/**
 * Derivations behind the story dashboard.
 *
 * Everything here works off the lifebooks the author already owns, so the
 * numbers on the dashboard can never disagree with the lists beside them.
 */

export const bookId = (book) => book?._id || book?.id || null;
export const chapterId = (chapter) => chapter?._id || chapter?.id || null;
export const entryId = (story) => story?._id || story?.id || null;

/** First image for a story: its own, then its chapter's, then the lifebook's. */
export function storyThumbnail(story, chapter, book) {
  const own = (story?.media || []).find((m) => m.type === "image");
  if (own?.url) return own.url;

  const fromChapter = (chapter?.media || []).find((m) => m.type === "image");
  if (fromChapter?.url) return fromChapter.url;

  return chapter?.coverImage?.url || book?.coverImage?.url || null;
}

/**
 * Every story entry across every lifebook, newest first, with the chapter and
 * lifebook it belongs to attached.
 */
export function flattenStories(books = []) {
  return books
    .flatMap((book) =>
      [...(book.chapters || [])]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((chapter) => ({ book, chapter })),
    )
    .flatMap(({ book, chapter }) =>
      (chapter.stories || []).map((story) => ({
        id: entryId(story),
        story,
        chapter,
        book,
        status: story.status === "published" ? "published" : "draft",
        words: countWords(story.content),
        preview: richTextToPlain(story.content).replace(/\s+/g, " ").trim(),
        thumb: storyThumbnail(story, chapter, book),
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

  const chapterMedia = books.reduce(
    (sum, book) =>
      sum +
      (book.chapters || []).reduce((n, ch) => n + (ch.media?.length || 0), 0),
    0,
  );

  return {
    lifebooks: books.length,
    published: rows.filter((r) => r.status === "published").length,
    drafts: rows.filter((r) => r.status === "draft").length,
    chapters: books.reduce((n, book) => n + (book.chapters?.length || 0), 0),
    stories: rows.length,
    likes: books.reduce((n, book) => n + (book.stats?.likes || 0), 0),
    comments: books.reduce((n, book) => n + (book.stats?.comments || 0), 0),
    media:
      chapterMedia + rows.reduce((n, row) => n + (row.mediaCount || 0), 0),
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
