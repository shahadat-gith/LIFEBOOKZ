/**
 * Which picture represents a lifebook, and which represents one story.
 *
 * A lifebook carries a banner and its stories carry photos; which one leads
 * depends on what is being shown, but the fallback chain is the same
 * everywhere, so it lives here.
 */

/** Every image inside a lifebook, in reading order. */
function imagesIn(book) {
  return (book?.chapters || [])
    .flatMap((chapter) => chapter.stories || [])
    .flatMap((story) => story.media || [])
    .filter((media) => media.type === "image" && media.url);
}

/**
 * The lifebook's own banner, or — if it has none — the first photo inside it,
 * so a card never shows an empty frame while the lifebook has pictures.
 */
export function lifebookCover(book) {
  return book?.bannerImage?.url || imagesIn(book)[0]?.url || null;
}

/** A story's own photo, falling back to the lifebook's cover. */
export function storyThumbnail(story, book) {
  const own = (story?.media || []).find(
    (media) => media.type === "image" && media.url,
  );
  return own?.url || book?.bannerImage?.url || null;
}
