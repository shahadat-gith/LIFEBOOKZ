import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { CONSULT_CATEGORIES } from "../config";
import * as expertApi from "../utils/client";
import { formatDate } from "../utils/helpers";

import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card, { CardContent, CardTitle } from "../components/ui/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";

import { Icons } from "../icons";

const STATUS_BADGE = {
  pending: { variant: "warning", label: "Pending" },
  confirmed: { variant: "info", label: "Confirmed" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "danger", label: "Cancelled" },
};

const SESSION_LABELS = {
  video: "Video call",
  audio: "Audio call",
  chat: "Chat session",
};

function categoryLabel(id) {
  if (!id) return "—";
  return CONSULT_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { expert, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      const data = await expertApi.getMyBookings();
      setBookings(data || []);
    } catch {
      toast.error("Could not load your bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !expert) navigate("/login", { replace: true });
  }, [expert, authLoading, navigate]);

  useEffect(() => {
    if (!expert) return;
    loadBookings();
  }, [expert, loadBookings]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
    }),
    [bookings],
  );

  const isApproved = expert?.verification?.status === "approved";
  const isRejected = expert?.verification?.status === "rejected";

  const handleStatusChange = async (booking, status) => {
    const id = booking._id || booking.id;
    setUpdatingId(id);
    try {
      await expertApi.updateBookingStatus(id, status);
      setBookings((prev) =>
        prev.map((b) => ((b._id || b.id) === id ? { ...b, status } : b)),
      );
      toast.success(`Booking marked as ${status}.`);
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || "Could not update the booking.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen message="Loading your expert workspace..." />;
  }

  if (!expert) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-10 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col justify-between gap-6 rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs md:flex-row md:items-center"
      >
        <div className="flex items-center gap-5">
          <Avatar
            src={expert.avatar?.url}
            name={expert.fullName}
            size="xl"
            className="ring-2 ring-border/80"
          />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Welcome, {expert.fullName}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              {expert.expertise}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  isApproved ? "success" : isRejected ? "danger" : "warning"
                }
              >
                {isApproved
                  ? "Verified Expert"
                  : isRejected
                    ? "Application Rejected"
                    : "Pending Approval"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {expert.rating ? `${expert.rating.toFixed(1)} ★` : "No ratings yet"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Link to="/profile">
            <Button
              size="lg"
              icon={<Icons.edit className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              Edit Profile
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Verification notice */}
      {!isApproved && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            isRejected
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-warning/30 bg-warning/10 text-warning"
          }`}
        >
          <div className="flex items-start gap-3">
            <Icons.infoCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              {isRejected ? (
                <>
                  <p className="font-semibold">Your application was rejected.</p>
                  {expert.verification?.rejectionReason && (
                    <p className="mt-1 text-xs">
                      Reason: {expert.verification.rejectionReason}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold">
                    Your application is under review.
                  </p>
                  <p className="mt-1 text-xs">
                    Once approved, your profile gets matched with people who
                    need your expertise and bookings will appear here.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Bookings", value: stats.total, tone: "text-foreground" },
          { label: "Pending", value: stats.pending, tone: "text-warning" },
          { label: "Confirmed", value: stats.confirmed, tone: "text-info" },
          { label: "Completed", value: stats.completed, tone: "text-success" },
        ].map((item) => (
          <Card key={item.label} padding="md" className="border border-border/60 bg-card/60 shadow-xs">
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className={`mt-2 font-display text-3xl font-semibold ${item.tone}`}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings */}
      <Card className="border border-border/60 bg-card shadow-xs">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
            <CardTitle className="font-display text-lg font-semibold tracking-tight">
              Consultation Requests
            </CardTitle>
            {bookings.length > 0 && (
              <button
                type="button"
                onClick={loadBookings}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Icons.refresh className="h-3.5 w-3.5" /> Refresh
              </button>
            )}
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              icon={<Icons.calendar className="h-10 w-10 text-muted-foreground" />}
              title="No bookings yet"
              description={
                isApproved
                  ? "When someone books a session with you, it will show up here."
                  : "Bookings will appear here once your account is approved."
              }
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const id = booking._id || booking.id;
                const badge = STATUS_BADGE[booking.status] || {
                  variant: "default",
                  label: booking.status,
                };
                const clientName =
                  booking.guestName || booking.user?.fullName || "Client";
                const busy = updatingId === id;

                return (
                  <motion.div
                    key={id}
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl border border-border/60 bg-background/50 p-4 sm:p-5 transition-all hover:border-border hover:bg-card hover:shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-display text-base font-semibold text-foreground">
                            {clientName}
                          </h3>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <Badge variant="default">
                            {categoryLabel(booking.category)}
                          </Badge>
                          <Badge variant="default">
                            {SESSION_LABELS[booking.sessionType] || booking.sessionType}
                          </Badge>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {booking.problem}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {booking.date && (
                            <span className="inline-flex items-center gap-1.5">
                              <Icons.calendar className="h-3.5 w-3.5" />
                              {formatDate(booking.date)} {booking.time && `· ${booking.time}`}
                            </span>
                          )}
                          {booking.guestEmail && (
                            <span className="inline-flex items-center gap-1.5">
                              <Icons.mail className="h-3.5 w-3.5" />
                              {booking.guestEmail}
                            </span>
                          )}
                          {booking.guestPhone && (
                            <span className="inline-flex items-center gap-1.5">
                              <Icons.phone className="h-3.5 w-3.5" />
                              {booking.guestPhone}
                            </span>
                          )}
                        </div>

                        {booking.notes && (
                          <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                            {booking.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {booking.status === "pending" && (
                          <Button
                            size="sm"
                            loading={busy}
                            onClick={() => handleStatusChange(booking, "confirmed")}
                            icon={<Icons.check className="h-3.5 w-3.5" />}
                          >
                            Confirm
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="success"
                            loading={busy}
                            onClick={() => handleStatusChange(booking, "completed")}
                            icon={<Icons.checkCircle className="h-3.5 w-3.5" />}
                          >
                            Mark Completed
                          </Button>
                        )}
                        {["pending", "confirmed"].includes(booking.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => handleStatusChange(booking, "cancelled")}
                            icon={<Icons.close className="h-3.5 w-3.5" />}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
