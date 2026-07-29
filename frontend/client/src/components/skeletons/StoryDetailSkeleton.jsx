export default function StoryDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-pulse">
      {/* Back Link */}
      <div className="h-4 w-24 bg-foreground/8 rounded-md mb-6" />

      {/* Story Type Badge */}
      <div className="h-5 w-28 bg-accent/20 rounded-full mb-4" />

      {/* Title */}
      <div className="space-y-3 mb-6">
        <div className="h-10 bg-foreground/12 rounded-md w-full" />
        <div className="h-10 bg-foreground/12 rounded-md w-3/4" />
      </div>

      {/* Cover Image */}
      <div className="w-full h-64 sm:h-80 lg:h-96 bg-foreground/8 rounded-2xl mb-6" />

      {/* Author Info Row */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-foreground/12" />
          <div className="space-y-1.5">
            <div className="h-4 bg-foreground/12 rounded-md w-32" />
            <div className="h-3 bg-foreground/8 rounded-md w-20" />
          </div>
        </div>
        <div className="h-8 w-28 rounded-full bg-foreground/12" />
      </div>

      {/* Summary Card */}
      <div className="mt-8 mb-8 p-6 rounded-2xl bg-foreground/5 border border-border/40 space-y-3">
        <div className="h-4 bg-foreground/8 rounded-md w-16" />
        <div className="h-3 bg-foreground/8 rounded-md w-full" />
        <div className="h-3 bg-foreground/8 rounded-md w-5/6" />
        <div className="h-3 bg-foreground/8 rounded-md w-3/4" />
      </div>

      {/* Content Paragraphs */}
      <div className="space-y-4">
        <div className="h-3 bg-foreground/8 rounded-md w-full" />
        <div className="h-3 bg-foreground/8 rounded-md w-full" />
        <div className="h-3 bg-foreground/8 rounded-md w-11/12" />
        <div className="h-3 bg-foreground/8 rounded-md w-full" />
        <div className="h-3 bg-foreground/8 rounded-md w-4/5" />
        <div className="h-3 bg-foreground/8 rounded-md w-full" />
        <div className="h-3 bg-foreground/8 rounded-md w-3/4" />
      </div>

      {/* Stats Row */}
      <div className="mt-8 py-4 border-t border-border/40">
        <div className="flex items-center gap-8">
          <div className="h-10 w-16 bg-foreground/8 rounded-lg" />
          <div className="h-10 w-16 bg-foreground/8 rounded-lg" />
          <div className="h-10 w-16 bg-foreground/8 rounded-lg" />
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8 pt-6 border-t border-border/40 space-y-4">
        <div className="h-5 bg-foreground/8 rounded-md w-24" />
        <div className="space-y-3">
          <div className="h-16 bg-foreground/5 rounded-xl w-full" />
          <div className="h-16 bg-foreground/5 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
