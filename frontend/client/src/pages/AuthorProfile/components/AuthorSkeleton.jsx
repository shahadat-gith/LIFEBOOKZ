/** The profile's shape, greyed out, while it loads. */
export default function AuthorSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse select-none px-4 py-10 sm:px-6">
      <div className="mb-8 h-4 w-24 rounded-md bg-muted" />

      <div className="mb-8 flex flex-col items-center gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-start">
        <div className="h-20 w-20 shrink-0 rounded-full bg-muted" />
        <div className="w-full flex-1 space-y-3 text-center sm:text-left">
          <div className="mx-auto h-6 w-48 rounded-md bg-muted sm:mx-0" />
          <div className="mx-auto h-3 w-32 rounded-md bg-muted/70 sm:mx-0" />
          <div className="mx-auto h-3 w-full max-w-md rounded-md bg-muted/70 sm:mx-0" />
          <div className="mx-auto h-9 w-28 rounded-xl bg-muted sm:mx-0" />
        </div>
      </div>

      <div className="space-y-5">
        {[1, 2].map((n) => (
          <div key={n} className="h-40 rounded-2xl border border-border/60 bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
