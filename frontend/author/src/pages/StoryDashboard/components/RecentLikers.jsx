import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";

/** The people behind the like counter, newest first. */
export default function RecentLikers({ likers = [] }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-xs">
      <header className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5">
        <h2 className="font-display text-base font-bold text-foreground">
          Recent likes
        </h2>
        <Icons.heartSolid className="h-4 w-4 text-destructive" />
      </header>

      {likers.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No likes yet — share a story to get the first one.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {likers.map((liker) => (
            <li key={liker.key} className="flex items-center gap-3 px-4 py-2.5">
              <Avatar
                src={liker.avatar}
                name={liker.name}
                size="sm"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {liker.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {liker.book}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
