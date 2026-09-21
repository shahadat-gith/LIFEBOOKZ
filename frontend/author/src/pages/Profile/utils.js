import { Icons } from "../../icons";
import {
  chapterHint,
  chapterLabel,
  chapterNumber,
  chapterTitle,
  sortChapters,
  suggestedTitle,
} from "../../utils/chapters";

/** The profile's tabs, in the order they are shown. */
export const PROFILE_TABS = [
  { key: "lifebook", label: "Lifebook", icon: Icons.book },
  { key: "stories", label: "Stories", icon: Icons.document },
  { key: "likes", label: "Likes", icon: Icons.heartRegular },
  { key: "activity", label: "Activity", icon: Icons.sparkles },
];

/** Pastel tint per chapter slot (matches the mockup's coloured cards). */
const CHAPTER_TINTS = [
  "bg-blue-50/70 border-blue-100",
  "bg-green-50/70 border-green-100",
  "bg-rose-50/70 border-rose-100",
  "bg-amber-50/70 border-amber-100",
  "bg-violet-50/70 border-violet-100",
  "bg-cyan-50/70 border-cyan-100",
];

const CHAPTER_NUM_COLORS = [
  "text-info",
  "text-success",
  "text-destructive",
  "text-warning",
  "text-accent",
  "text-info",
];

/**
 * One row per chapter across the author's lifebooks, with everything the
 * chapter cards and the stories/memories tabs need already resolved.
 *
 * The rows come from the lifebooks the tabs render, so the counters can never
 * disagree with the lists below them.
 */
export function chapterRows(stories = []) {
  return stories
    .flatMap((book) =>
      sortChapters(book.chapters).map((chapter) => ({ ...chapter, book })),
    )
    .map((chapter) => {
      const order = Number(chapter.order) || 0;
      // Author lifebooks show all chapters side by side, so the tint follows
      // the chapter's slot rather than its place in the list.
      const cover = (chapter.stories || [])
        .flatMap((story) => story.media || [])
        .find((media) => media.type === "image")?.url;

      const name = chapterTitle(chapter);

      return {
        ...chapter,
        order,
        number: chapterNumber(order),
        name,
        label: chapterLabel(chapter),
        // A slot's description only applies while the chapter still carries
        // the slot's own name.
        hint: name === suggestedTitle(order) ? chapterHint(order) : "",
        storyCount: chapter.stories?.length || 0,
        tint: CHAPTER_TINTS[order % CHAPTER_TINTS.length],
        numColor: CHAPTER_NUM_COLORS[order % CHAPTER_NUM_COLORS.length],
        cover: cover || null,
      };
    });
}

/**
 * The four headline numbers under the profile header.
 *
 * `stats` is null until the social counts arrive, so it is normalized here
 * rather than guarded at every use.
 */
export function profileStats(rows = [], stats = null) {
  const { followers = 0, following = 0 } = stats || {};

  return [
    { value: followers, label: "Followers" },
    { value: following, label: "Following" },
    { value: rows.length, label: "Chapters" },
    {
      value: rows.reduce((sum, row) => sum + (row.storyCount || 0), 0),
      label: "Stories",
    },
  ];
}
