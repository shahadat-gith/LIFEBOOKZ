import { Icons } from "../../icons";
import { getCategoryLabel } from "../../data/coaches";

function getInitials(name) {
  return (name || "")
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const RANK_STYLES = {
  1: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30",
  2: "bg-slate-400/15 text-slate-600 dark:text-slate-300 ring-slate-400/30",
  3: "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-orange-500/30",
};

export function ExpertMatchCard({ expert, onBook }) {
  const id = expert.id || expert._id;
  const rank = expert.matchRank;
  const rankClass =
    RANK_STYLES[rank] ||
    "bg-muted text-muted-foreground ring-border";

  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {expert.avatar?.url ? (
              <img
                src={expert.avatar.url}
                alt={expert.fullName}
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-border/70"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground ring-4 ring-primary/10">
                {getInitials(expert.fullName)}
              </div>
            )}
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                {expert.fullName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {expert.expertise}
              </p>
            </div>
          </div>

          {rank && (
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${rankClass}`}
            >
              #{rank} Match
            </span>
          )}
        </div>

        {/* Qualification */}
        {expert.qualification && (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Icons.academic className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
            {expert.qualification}
          </p>
        )}

        {/* Bio */}
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {expert.bio}
        </p>

        {/* Categories */}
        {expert.categories?.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            {expert.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1"
              >
                {getCategoryLabel(cat)}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-600 dark:text-amber-400">
            <Icons.starSolid className="h-3 w-3" />
            {(expert.rating || 0).toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icons.userCheck className="h-3 w-3" />
            {expert.sessions || 0} sessions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icons.clock className="h-3 w-3" />
            {expert.experience || 0} yrs exp
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Per session
          </p>
          <p className="font-display text-xl font-extrabold text-foreground">
            {expert.price ? `$${expert.price}` : "Free"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onBook?.(expert)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
        >
          Book Session
          <Icons.arrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default ExpertMatchCard;
