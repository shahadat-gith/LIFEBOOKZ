import { Icons } from "../../../icons";

/** One tile of the profile's stat strip. */
function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-foreground">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * How much this member has going on: who they follow and their consultation
 * counts. The booking tiles show an em dash when the summary didn't load,
 * with a retry offered underneath.
 */
export default function ProfileStats({ user, activity, failed, onRetry }) {
  const orDash = (value) => (activity ? value : "—");

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Icons.userCheck}
          label="Following"
          value={user?.stats?.following ?? 0}
          hint="Authors you follow"
        />
        <StatTile
          icon={Icons.book}
          label="Bookings"
          value={orDash(activity?.total)}
          hint="Consultation sessions"
        />
        <StatTile
          icon={Icons.clock}
          label="Upcoming"
          value={orDash(activity?.upcoming)}
          hint="Pending or confirmed"
        />
        <StatTile
          icon={Icons.checkCircle}
          label="Completed"
          value={orDash(activity?.completed)}
          hint="Sessions wrapped up"
        />
      </section>

      {failed && (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <Icons.infoCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            We couldn&apos;t load your session summary right now.
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="font-bold text-foreground underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}
