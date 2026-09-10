import { Link } from "react-router-dom";
import { Icons } from "../../icons";

const CATEGORY_ICONS = {
  education: Icons.academic,
  relationship: Icons.heartSolid,
  career: Icons.briefcase,
  business: Icons.sparkles,
  growth: Icons.userAdd,
  health: Icons.shieldCheck,
};

function getInitials(name) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CoachCard({ coach, category }) {
  const Icon = CATEGORY_ICONS[coach.category] || Icons.sparkles;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold shadow-inner ${coach.avatarColor}`}
            >
              {getInitials(coach.name)}
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                {coach.name}
              </h3>
              <p className="text-xs text-muted-foreground">{coach.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Icons.starSolid className="h-3 w-3" />
            {coach.rating.toFixed(1)}
          </div>
        </div>

        {/* Bio */}
        <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {coach.bio}
        </p>

        {/* Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          {category && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1">
              <Icon className="h-3 w-3 text-accent" />
              {category.label}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1">
            <Icons.userCheck className="h-3 w-3" />
            {coach.sessions} sessions
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1">
            <Icons.clock className="h-3 w-3" />
            {coach.experience} yrs exp
          </span>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Per session
          </p>
          <p className="font-display text-xl font-extrabold text-foreground">
            ${coach.price}
          </p>
        </div>

        <Link
          to={`/consult/book/${coach.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
        >
          Book Session
          <Icons.arrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}