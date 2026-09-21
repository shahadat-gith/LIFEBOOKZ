import StorySection from "./StorySection";
import { chapterLabel } from "../../../utils/chapters";

/** One chapter: its title, then the stories written in it. */
export default function ChapterCard({ chapter }) {
  const stories = chapter.stories || [];

  return (
    <article className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      {/* Chapter title */}
      <header className="border-b border-border/60 px-4 py-3.5 sm:px-5">
        <h2 className="truncate font-display text-base font-bold text-foreground sm:text-lg">
          {chapterLabel(chapter)}
        </h2>
      </header>

      {stories.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm italic text-muted-foreground sm:px-5">
          No stories in this chapter yet.
        </p>
      ) : (
        stories.map((entry, index) => (
          <StorySection
            key={entry._id || index}
            entry={entry}
            number={index + 1}
          />
        ))
      )}
    </article>
  );
}
