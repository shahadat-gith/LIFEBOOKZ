import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { CONSULT_CATEGORIES } from "../../config";
import * as consultApi from "../../api/consultation";
import { formatDate } from "../../utils/helpers";

import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardContent, CardTitle } from "../../components/ui/Card";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";

import { Icons } from "../../icons";

const STATUS_BADGE = {
  PENDING: { variant: "warning", label: "New request" },
  CONFIRMED: { variant: "info", label: "Confirmed — waiting for client" },
  IN_PROGRESS: { variant: "success", label: "In session" },
  COMPLETED: { variant: "default", label: "Completed" },
  CANCELLED: { variant: "danger", label: "Cancelled" },
  EXPIRED: { variant: "danger", label: "Expired" },
};

function categoryLabel(id) {
  if (!id) return "—";
  return CONSULT_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { expert, isLoading: authLoading, setAvailability: persistAvailability } = useAuth();

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const loadConsultations = useCallback(async () => {
    try {
      const data = await consultApi.listMine();
      setConsultations(data || []);
    } catch {
      toast.error("Could not load your consultations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !expert) navigate("/login", { replace: true });
  }, [expert, authLoading, navigate]);

  useEffect(() => {
    if (!expert) return;
    loadConsultations();
  }, [expert, loadConsultations]);

  const stats = useMemo(() => {
    const count = (status) => consultations.filter((c) => c.status === status).length;
    return {
      total: consultations.length,
      pending: count("PENDING"),
      active: count("CONFIRMED"),
      inProgress: count("IN_PROGRESS"),
      completed: count("COMPLETED"),
    };
  }, [consultations]);

  const isApproved = expert?.verification?.status === "approved";
  const isRejected = expert?.verification?.status === "rejected";
  const isAvailable = expert?.isAvailable !== false;

  /** Master switch: appear in search results / take new requests or not. */
  const toggleAvailability = async () => {
    if (togglingAvailability) return;
    setTogglingAvailability(true);
    try {
      await persistAvailability(!isAvailable);
      toast.success(
        isAvailable
          ? "You are now unavailable — new requests won't reach you."
          : "You are available again — clients can find you.",
      );
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || "Could not update availability.",
      );
    } finally {
      setTogglingAvailability(false);
    }
  };

  const run = (id, fn) => async () => {
    setBusyId(id);
    try {
      await fn();
      await loadConsultations();
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || "That didn't work. Please try again.",
      );
    } finally {
      setBusyId(null);
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
              <Badge variant={isAvailable ? "success" : "danger"}>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isAvailable ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {expert.ratingCount
                  ? `${expert.rating.toFixed(1)} ★ · ${expert.ratingCount} rating${expert.ratingCount === 1 ? "" : "s"}`
                  : "No ratings yet"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            size="lg"
            variant={isAvailable ? "ghost" : "success"}
            loading={togglingAvailability}
            onClick={toggleAvailability}
            icon={
              isAvailable ? (
                <Icons.close className="h-4 w-4" />
              ) : (
                <Icons.check className="h-4 w-4" />
              )
            }
            className="w-full sm:w-auto"
          >
            {isAvailable ? "Mark unavailable" : "Mark available"}
          </Button>
          <Link to="/profile/edit">
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
                    need your expertise and requests will appear here.
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
          { label: "Total Requests", value: stats.total, tone: "text-foreground" },
          { label: "Awaiting Your Reply", value: stats.pending, tone: "text-warning" },
          { label: "Live / Upcoming", value: stats.active + stats.inProgress, tone: "text-info" },
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

      {/* Consultations */}
      <Card className="border border-border/60 bg-card shadow-xs">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
            <CardTitle className="font-display text-lg font-semibold tracking-tight">
              Consultation Requests
            </CardTitle>
            {consultations.length > 0 && (
              <button
                type="button"
                onClick={loadConsultations}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Icons.refresh className="h-3.5 w-3.5" /> Refresh
              </button>
            )}
          </div>

          {consultations.length === 0 ? (
            <EmptyState
              icon={<Icons.videoCamera className="h-10 w-10 text-muted-foreground" />}
              title="No requests yet"
              description={
                isApproved
                  ? "When someone requests a session with you, it will show up here."
                  : "Requests will appear here once your account is approved."
              }
            />
          ) : (
            <div className="space-y-3">
              {consultations.map((consultation) => {
                const id = consultation._id || consultation.id;
                const badge = STATUS_BADGE[consultation.status] || {
                  variant: "default",
                  label: consultation.status,
                };
                const clientName = consultation.user?.fullName || "Client";
                const busy = busyId === id;

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
                          {consultation.category && (
                            <Badge variant="default">
                              {categoryLabel(consultation.category)}
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {consultation.problem}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {consultation.userEmail && (
                            <span className="inline-flex items-center gap-1.5">
                              <Icons.mail className="h-3.5 w-3.5" />
                              {consultation.userEmail}
                            </span>
                          )}
                          {typeof consultation.amount === "number" && (
                            <span className="inline-flex items-center gap-1.5">
                              <Icons.money className="h-3.5 w-3.5" />
                              ₹{(consultation.amount / 100).toFixed(0)} — client pays when they join
                            </span>
                          )}
                        </div>

                        {consultation.notes && (
                          <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                            {consultation.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {consultation.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              loading={busy}
                              onClick={run(id, () => consultApi.accept(id))}
                              icon={<Icons.check className="h-3.5 w-3.5" />}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={run(id, () => consultApi.decline(id))}
                              icon={<Icons.close className="h-3.5 w-3.5" />}
                            >
                              Decline
                            </Button>
                          </>
                        )}

                        {["CONFIRMED", "IN_PROGRESS"].includes(consultation.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => navigate(`/consult/${id}/session`)}
                              icon={<Icons.videoCamera className="h-3.5 w-3.5" />}
                            >
                              {consultation.status === "IN_PROGRESS" ? "Rejoin session" : "Join session"}
                            </Button>
                            {consultation.status === "IN_PROGRESS" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                onClick={run(id, () => consultApi.endSession(id))}
                                icon={<Icons.close className="h-3.5 w-3.5" />}
                              >
                                Close meeting
                              </Button>
                            )}
                          </>
                        )}

                        {["PENDING", "CONFIRMED"].includes(consultation.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={run(id, () => consultApi.cancel(id))}
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
