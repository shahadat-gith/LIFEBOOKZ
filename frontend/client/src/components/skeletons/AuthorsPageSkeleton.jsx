export default function AuthorsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 select-none">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border/40 pb-8">
        <div className="space-y-3">
          <div className="h-10 bg-foreground/12 rounded-lg w-64" />
          <div className="h-4 bg-foreground/8 rounded-md w-96 max-w-full" />
        </div>
        <div className="h-10 w-72 bg-foreground/8 rounded-xl" />
      </div>

      {/* Author Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-card border border-border/50 animate-pulse flex flex-col items-center"
          >
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-foreground/12 mb-4" />
            {/* Name */}
            <div className="h-4 bg-foreground/12 rounded-md w-3/4 mb-2" />
            {/* Profession */}
            <div className="h-3 bg-foreground/8 rounded-md w-1/2 mb-4" />
            {/* Bio lines */}
            <div className="w-full space-y-2 mb-6">
              <div className="h-3 bg-foreground/8 rounded-md w-full" />
              <div className="h-3 bg-foreground/8 rounded-md w-4/5" />
            </div>
            {/* Divider */}
            <div className="w-full h-px bg-border/40 mb-4" />
            {/* Footer: story count + date */}
            <div className="flex items-center justify-between w-full">
              <div className="h-3 bg-foreground/8 rounded-md w-20" />
              <div className="h-3 bg-foreground/8 rounded-md w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
