export default function StoryCardSkeleton({ showActions = true }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xs animate-pulse">
      {/* Cover Image Placeholder */}
      <div className="w-full h-48 sm:h-56 bg-foreground/8" />

      {/* Author Info Row */}
      <div className="flex items-center justify-between gap-4 p-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-foreground/12 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Author name */}
            <div className="h-3.5 bg-foreground/12 rounded-md w-24" />
            {/* Time */}
            <div className="h-2.5 bg-foreground/8 rounded-md w-16" />
          </div>
        </div>
        {/* Follow button */}
        <div className="h-7 w-16 rounded-full bg-foreground/12" />
      </div>

      {/* Title */}
      <div className="px-5 pb-2 space-y-2">
        <div className="h-5 bg-foreground/12 rounded-md w-3/4" />
      </div>

      {/* Summary / Snippet */}
      <div className="px-5 pb-2 space-y-2">
        <div className="h-3 bg-foreground/8 rounded-md w-full" />
        <div className="h-3 bg-foreground/8 rounded-md w-5/6" />
        <div className="h-3 bg-foreground/8 rounded-md w-2/3" />
      </div>

      {/* Read full story link */}
      <div className="px-5 pb-2">
        <div className="h-3 bg-accent/25 rounded-md w-28" />
      </div>

      {/* Stats Row */}
      {showActions && (
        <div className="px-5 pt-4 pb-5 mt-1 border-t border-border/40">
          <div className="flex items-center gap-6">
            <div className="h-4 w-14 bg-foreground/8 rounded-md" />
            <div className="h-4 w-14 bg-foreground/8 rounded-md" />
            <div className="h-4 w-14 bg-foreground/8 rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
}
