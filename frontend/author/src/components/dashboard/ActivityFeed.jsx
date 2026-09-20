import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";
import { getTimeAgo } from "../../utils/helpers";

const ACTIONS = {
  like: { verb: "liked your lifebook", Icon: Icons.heartSolid, tone: "text-destructive" },
  comment: { verb: "commented on your lifebook", Icon: Icons.chat, tone: "text-info" },
};

/**
 * Who has been reading: the author's recent likes and comments, newest first.
 * Each row carries the actor's name and picture as they are *now*, and opens
 * the story it happened on.
 */
export default function ActivityFeed({
  items = [],
  loading = false,
  error = null,
  onRetry,
  onOpen,
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-xs">
      <header className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5">
        <h2 className="font-display text-base font-bold text-foreground">
          Recent activity
        </h2>
        <Icons.sparkles className="h-4 w-4 text-muted-foreground" />
      </header>

      {loading ? (
        <div className="space-y-3 p-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your activity.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Icons.sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display font-semibold text-foreground">
            No activity yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Likes and comments on your stories will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((n) => {
            const action = ACTIONS[n.type] || ACTIONS.like;
            const name = n.actor?.name || "Someone";

            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onOpen?.(n)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  {n.actor?.avatar?.url ? (
                    <Avatar
                      src={n.actor.avatar.url}
                      name={name}
                      size="sm"
                      className="mt-0.5 shrink-0"
                    />
                  ) : (
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${action.tone}`}
                    >
                      <action.Icon className="h-4 w-4" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{name}</span>{" "}
                      <span className="text-muted-foreground">
                        {action.verb}
                      </span>
                    </p>

                    {n.type === "comment" && n.preview && (
                      <p className="mt-0.5 line-clamp-2 text-xs italic text-muted-foreground">
                        “{n.preview}”
                      </p>
                    )}

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {getTimeAgo(n.createdAt) || "recently"}
                    </p>
                  </div>

                  {!n.read && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
                      aria-label="Unread"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
