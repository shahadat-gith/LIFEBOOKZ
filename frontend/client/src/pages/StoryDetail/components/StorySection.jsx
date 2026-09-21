import StoryMedia from "./StoryMedia";
import RichText from "./RichText";
import { Icons } from "../../../icons";
import { formatPosted, storyPostedAt } from "../utils";

/**
 * One story: "Story 1 - title", when and where it happened, its pictures and
 * then what was written.
 */
export default function StorySection({ entry, number }) {
  const posted = storyPostedAt(entry);
  const media = entry.media || [];
  const hasMeta =
    entry.dateLabel || entry.location || entry.storyType || posted;

  return (
    <section className="border-b border-border/60 last:border-b-0">
      <header className="border-b border-border/60 px-4 py-3.5 sm:px-5">
        <h3 className="text-center font-display text-lg font-semibold text-foreground">
          Story {number} - {entry.title || "Untitled"}
        </h3>

        {hasMeta && (
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {entry.dateLabel && (
                <span className="inline-flex items-center gap-1">
                  <Icons.clock className="h-3.5 w-3.5" />
                  {entry.dateLabel}
                </span>
              )}
              {entry.location && (
                <span className="inline-flex items-center gap-1">
                  <Icons.globe className="h-3.5 w-3.5" />
                  {entry.location}
                </span>
              )}
              {entry.storyType && (
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                  {entry.storyType}
                </span>
              )}
            </div>

            {posted && (
              <span className="font-semibold">{formatPosted(posted)}</span>
            )}
          </div>
        )}
      </header>

      {media.length > 0 && (
        <div className="border-b border-border/60 px-4 py-4 sm:px-5">
          <StoryMedia media={media} />
        </div>
      )}

      <div className="px-4 py-4 sm:px-5">
        <RichText
          content={entry.content}
          className="text-[15px] leading-relaxed text-foreground/90"
        />
      </div>
    </section>
  );
}
