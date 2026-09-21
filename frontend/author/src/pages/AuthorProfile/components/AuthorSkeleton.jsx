/** Placeholder shown while an author's profile loads. */
export default function AuthorSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8 sm:px-6">
      <div className="mb-8 h-4 w-24 rounded bg-muted" />

      <div className="flex flex-col items-center gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-start">
        <div className="h-20 w-20 shrink-0 rounded-full bg-muted" />
        <div className="w-full flex-1 space-y-3">
          <div className="mx-auto h-6 w-48 rounded bg-muted sm:mx-0" />
          <div className="mx-auto h-3 w-32 rounded bg-muted/70 sm:mx-0" />
          <div className="mx-auto h-3 w-full max-w-md rounded bg-muted/70 sm:mx-0" />
          <div className="mx-auto h-9 w-32 rounded-xl bg-muted sm:mx-0" />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {[1, 2].map((n) => (
          <div key={n} className="h-56 rounded-xl bg-muted/70" />
        ))}
      </div>
    </div>
  );
}
