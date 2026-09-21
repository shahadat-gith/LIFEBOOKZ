/** Placeholder shown while a lifebook is loading. */
export default function StorySkeleton() {
  return (
    <div className="mx-auto max-w-3xl py-10 px-4 sm:px-6">
      <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted/70" />
      <div className="mt-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-muted/60" />
        ))}
      </div>
    </div>
  );
}
