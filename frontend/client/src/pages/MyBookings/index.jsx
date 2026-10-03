import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import LoadingScreen from "../../components/common/LoadingScreen";
import SignInPrompt from "../../components/common/SignInPrompt";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";

import * as consultApi from "../../api/consultation";

import BookingCard from "./components/BookingCard";
import RatingDialog from "./components/RatingDialog";

/**
 * The reader's consultations — one card per session with the action that
 * matches its state: join the room (payment happens at its door), rate when
 * completed, cancel while still open.
 */
export default function MyBookings() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await consultApi.listMine();
      setConsultations(data || []);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "We couldn't load your sessions. Please try again.",
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
    loadConsultations();
  }, [authLoading, isAuthenticated, loadConsultations]);

  const handleJoin = (consultation) => {
    const id = consultation._id || consultation.id;
    navigate(`/consult/${id}/session`);
  };

  const handleRate = async (consultation, score, review) => {
    const id = consultation._id || consultation.id;
    await consultApi.rate(id, score, review);
    await loadConsultations();
  };

  const handleCancel = async (consultationId) => {
    setCancellingId(consultationId);

    try {
      await consultApi.cancel(consultationId);
      setConsultations((prev) =>
        prev.map((c) =>
          (c._id || c.id) === consultationId ? { ...c, status: "CANCELLED" } : c,
        ),
      );
      toast.success("Session cancelled.");
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "We couldn't cancel this session. Please try again.",
      );
    } finally {
      setCancellingId(null);
      setConfirmingId(null);
    }
  };

  if (authLoading || (isAuthenticated && loading)) {
    return <LoadingScreen message="Loading your sessions…" />;
  }

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to see your sessions"
        description="Your consultation sessions are tied to your account. Log in to view and manage them."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Your Sessions
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            My Bookings
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Track your consultation requests — once the expert confirms, join
            the room, pay at the door, and rate the session afterwards.
          </p>
        </header>

        {error ? (
          <ErrorState
            title="Sessions didn't load"
            message={error}
            onRetry={loadConsultations}
          />
        ) : consultations.length === 0 ? (
          <EmptyState
            variant="panel"
            icon={Icons.book}
            title="No sessions yet"
            description="Find an expert who understands your situation and request your first session."
            action={{
              label: "Find an Expert",
              to: "/consult/book",
              icon: <Icons.search className="h-4 w-4" />,
            }}
          />
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => {
              const id = consultation._id || consultation.id;

              return (
                <BookingCard
                  key={id}
                  consultation={consultation}
                  confirming={confirmingId === id}
                  cancelling={cancellingId === id}
                  onConfirm={() => setConfirmingId(id)}
                  onDismissConfirm={() => setConfirmingId(null)}
                  onCancel={() => handleCancel(id)}
                  onJoin={() => handleJoin(consultation)}
                  onRate={() => setRatingTarget(consultation)}
                />
              );
            })}
          </div>
        )}

        {consultations.length > 0 && (
          <div className="pt-2 text-center">
            <Link
              to="/consult/book"
              className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
            >
              <Icons.plus className="h-4 w-4" />
              Request another session
            </Link>
          </div>
        )}
      </div>

      {ratingTarget && (
        <RatingDialog
          consultation={ratingTarget}
          onClose={() => setRatingTarget(null)}
          onSubmit={handleRate}
        />
      )}
    </div>
  );
}
