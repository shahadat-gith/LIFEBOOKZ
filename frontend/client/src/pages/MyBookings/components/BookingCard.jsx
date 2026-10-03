import { Link } from "react-router-dom";
import { Icons } from "../../../icons";
import { CANCELLABLE, JOINABLE, initials, statusStyle, formatDuration } from "../utils";

/** One star of the rating row. */
function Star({ filled }) {
  return (
    <Icons.starSolid
      className={`h-3.5 w-3.5 ${filled ? "text-amber-500" : "text-border"}`}
    />
  );
}

/**
 * One consultation: who it is with, its lifecycle state and the action that
 * matches — join the room (payment happens at its door), rate, or cancel.
 */
export default function BookingCard({
  consultation,
  confirming,
  cancelling,
  onConfirm,
  onDismissConfirm,
  onCancel,
  onJoin,
  onRate,
}) {
  const expert = consultation.expert;
  const id = consultation._id || consultation.id;
  const status = statusStyle(consultation.status);
  const isPaid =
    Boolean(consultation.payment?.paid) || consultation.amount === 0;
  const canCancel = CANCELLABLE.includes(consultation.status);
  const canJoin = JOINABLE.includes(consultation.status);
  const canRate = consultation.status === "COMPLETED" && !consultation.rating?.score;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {expert?.avatar?.url ? (
            <img
              src={expert.avatar.url}
              alt={expert.fullName}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-border/70"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground ring-4 ring-primary/10">
              {initials(expert?.fullName || "Expert")}
            </div>
          )}

          <div className="min-w-0">
            <Link
              to={expert ? `/consult/book/${expert._id || expert.id}` : "/consult"}
              className="font-display text-base font-bold text-foreground hover:text-accent"
            >
              {expert?.fullName || "Expert unavailable"}
            </Link>
            {expert?.expertise && (
              <p className="truncate text-xs text-muted-foreground">
                {expert.expertise}
              </p>
            )}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {consultation.problem}
      </p>

      {/* Metadata strip */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
        {typeof consultation.amount === "number" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
            <Icons.money className="h-3 w-3" />
            ₹{(consultation.amount / 100).toFixed(0)}
          </span>
        )}
        {consultation.category && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
            {consultation.category}
          </span>
        )}
        {consultation.session?.durationSeconds > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
            <Icons.videoCamera className="h-3 w-3" />
            {formatDuration(consultation.session.durationSeconds)}
          </span>
        )}
      </div>

      {/* The rating the user left */}
      {consultation.rating?.score && (
        <div className="mt-3 flex items-center gap-2">
          <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} filled={n <= consultation.rating.score} />
            ))}
          </span>
          {consultation.rating.review && (
            <span className="truncate text-xs text-muted-foreground">
              “{consultation.rating.review}”
            </span>
          )}
        </div>
      )}

      {consultation.notes && (
        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {consultation.notes}
        </p>
      )}

      {/* Actions — the one that matches the state */}
      {(canJoin || canRate || canCancel) && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
          {confirming ? (
            <>
              <span className="mr-auto text-xs font-medium text-muted-foreground">
                Cancel this session?
              </span>
              <button
                type="button"
                onClick={onDismissConfirm}
                disabled={cancelling}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Keep session
              </button>
              <button
                type="button"
                onClick={() => onCancel(id)}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Icons.close className="h-3.5 w-3.5" />
                Yes, cancel
              </button>
            </>
          ) : (
            <>
              {canJoin && (
                <button
                  type="button"
                  onClick={onJoin}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Icons.videoCamera className="h-3.5 w-3.5" />
                  {consultation.status === "IN_PROGRESS" ? "Rejoin session" : "Join session"}
                  {!isPaid && " & pay"}
                </button>
              )}

              {canRate && (
                <button
                  type="button"
                  onClick={onRate}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 px-5 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
                >
                  <Icons.starSolid className="h-3.5 w-3.5" />
                  Rate session
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={onConfirm}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icons.close className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
