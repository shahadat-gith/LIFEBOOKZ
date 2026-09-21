/** Placeholder card shown while the first page of the feed loads. */
export default function StoryCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="h-48 bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-5 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/4 rounded bg-muted" />
      </div>
    </div>
  );
}
