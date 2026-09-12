import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { getCategoryLabel } from "../data/coaches";
import { Icons } from "../icons";

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

const SESSION_LABELS = {
  video: "Video Call",
  audio: "Audio Call",
  chat: "Chat Session",
};

const CANCELLABLE = ["pending", "confirmed"];

function initials(name) {
  return (name || "")
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function MyBookings() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/consult/bookings");
      setBookings(res.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "We couldn't load your bookings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadBookings();
  }, [authLoading, isAuthenticated, loadBookings]);

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await api.patch(`/consult/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((b) =>
          (b._id || b.id) === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      toast.success("Booking cancelled.");
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "We couldn't cancel this booking. Please try again.",
      );
    } finally {
      setCancellingId(null);
      setConfirmingId(null);
    }
  };

  /* ---------- Auth / loading ---------- */
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
        <div className="mx-auto max-w-xl space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icons.lock className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Sign in to see your bookings
          </h1>
          <p className="text-sm text-muted-foreground">
            Your consultation sessions are tied to your account. Log in to view
            and manage them.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <Icons.login className="h-4 w-4" />
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Your Sessions
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            My Bookings
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Track your consultation requests and manage your upcoming sessions.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <Icons.exclamationCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={loadBookings}
              className="font-bold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!error && bookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icons.book className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              No bookings yet
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Find an expert who understands your situation and book your first
              session.
            </p>
            <Link
              to="/consult/book"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              <Icons.search className="h-4 w-4" />
              Find an Expert
            </Link>
          </div>
        )}

        {/* Bookings */}
        {bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const id = booking._id || booking.id;
              const status = STATUS_STYLES[booking.status] || {
                label: booking.status,
                className: "bg-muted text-muted-foreground border-border",
              };
              const expert = booking.expert;
              const canCancel = CANCELLABLE.includes(booking.status);
              const isConfirming = confirmingId === id;
              const isCancelling = cancellingId === id;

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm sm:p-6"
                >
                  {/* Expert + status */}
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

                  {/* Problem */}
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {booking.problem}
                  </p>

                  {/* Meta chips */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                      {booking.category
                        ? getCategoryLabel(booking.category)
                        : "General consultation"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                      <Icons.chat className="h-3 w-3" />
                      {SESSION_LABELS[booking.sessionType] || booking.sessionType}
                    </span>
                    {(booking.date || booking.time) && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                        <Icons.clock className="h-3 w-3" />
                        {[formatDate(booking.date), booking.time]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                      <Icons.tag className="h-3 w-3" />
                      Booked{" "}
                      {new Date(booking.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      {booking.notes}
                    </p>
                  )}

                  {/* Actions */}
                  {canCancel && (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
                      {isConfirming ? (
                        <>
                          <span className="mr-auto text-xs font-medium text-muted-foreground">
                            Cancel this session?
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            disabled={isCancelling}
                            className="rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                          >
                            Keep booking
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(id)}
                            disabled={isCancelling}
                            className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                          >
                            {isCancelling ? (
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
                            onClick={() => setConfirmingId(id)}
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
            })}
          </div>
        )}

        {/* Footer CTA */}
        {bookings.length > 0 && (
          <div className="pt-2 text-center">
            <Link
              to="/consult/book"
              className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
            >
              <Icons.plus className="h-4 w-4" />
              Book another session
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
