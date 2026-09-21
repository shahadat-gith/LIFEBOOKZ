import { useState } from "react";
import { Icons } from "../../../icons";

/**
 * A story's pictures. One photo (or video) spans the full width; several are
 * read one at a time in a carousel, each still full width. A story with no
 * media renders nothing at all.
 */
export default function StoryMedia({ media = [] }) {
  const [index, setIndex] = useState(0);
  const count = media.length;

  if (count === 0) return null;

  const go = (step) => setIndex((current) => (current + step + count) % count);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/40">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {media.map((item, i) => (
            <div key={i} className="w-full flex-shrink-0">
              {item.type === "video" ? (
                <video
                  src={item.url}
                  controls
                  className="max-h-[30rem] w-full bg-black object-contain"
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || "Story photo"}
                  loading="lazy"
                  className="max-h-[30rem] w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              <Icons.chevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              <Icons.chevronRight className="h-4 w-4" />
            </button>
            <span className="absolute right-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-foreground">
              {index + 1}/{count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {media.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
