import { Link } from "react-router-dom";
import { Icons } from "../../../icons";
import BookingChips from "./BookingChips";
import { CANCELLABLE, initials, statusStyle } from "../utils";

/**
 * One consultation request: who it is with, its status, what it is about and
 * the two things a reader can do — book again, or cancel after confirming.
 */
export default function BookingCard({
  booking,
  confirming,
  cancelling,
  onConfirm,
  onDismissConfirm,
  onCancel,
}) {
  const expert = booking.expert;
  const id = booking._id || booking.id;
  const status = statusStyle(booking.status);
  const canCancel = CANCELLABLE.includes(booking.status);

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
        {booking.problem}
      </p>

      <BookingChips booking={booking} />

      {booking.notes && (
        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {booking.notes}
        </p>
      )}

      {canCancel && (
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
                Keep booking
              </button>
              <button
                type="button"
                onClick={() => onCancel(id)}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {cancelling ? (
                  <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icons.close className="h-3.5 w-3.5" />
                )}
                Yes, cancel
              </button>
            </>
          ) : (
            <>
              <Link
                to={`/consult/book/${expert?._id || expert?.id || ""}`}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                Book again
              </Link>
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10"
              >
                <Icons.close className="h-3.5 w-3.5" />
                Cancel booking
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
