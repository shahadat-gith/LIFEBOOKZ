import { Icons } from "../../../icons";
import { getCategoryLabel } from "../../../data/coaches";
import { initials } from "../utils";

/** The expert being booked: who they are, what they do, and what they cost. */
export default function ExpertSidebar({ expert }) {
  return (
    <aside className="h-fit space-y-5 lg:sticky lg:top-28">
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
        <div className="flex items-center gap-4">
          {expert.avatar?.url ? (
            <img
              src={expert.avatar.url}
              alt={expert.fullName}
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-border/70"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground">
              {initials(expert.fullName)}
            </div>
          )}

          <div>
            <h1 className="font-display text-xl font-extrabold text-foreground">
              {expert.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">{expert.expertise}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
          {expert.categories?.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1"
            >
              {getCategoryLabel(category)}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
            <Icons.userCheck className="h-3 w-3" />
            {expert.sessions || 0} sessions
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
            <Icons.clock className="h-3 w-3" />
            {expert.experience || 0} yrs exp
          </span>
        </div>

        {expert.qualification && (
          <p className="mt-4 flex items-start gap-1.5 text-xs font-semibold text-muted-foreground">
            <Icons.academic className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
            {expert.qualification}
          </p>
        )}

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {expert.bio}
        </p>

        <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-4">
          <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
            <Icons.starSolid className="h-4 w-4" />
            {(expert.rating || 0).toFixed(1)}
          </div>
          {expert.languages?.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icons.globe className="h-4 w-4" />
              {expert.languages.join(", ")}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
