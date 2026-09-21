import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import LoadingScreen from "../../components/common/LoadingScreen";
import SignInPrompt from "../../components/common/SignInPrompt";
import ErrorState from "../../components/common/ErrorState";
import NoDataState from "../../components/common/NoDataState";

import BookingCard from "./components/BookingCard";

/**
 * The reader's consultation requests.
 *
 * The page owns the list and the cancel flow; each booking renders itself.
 */
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
        prev.map((booking) =>
          (booking._id || booking.id) === bookingId
            ? { ...booking, status: "cancelled" }
            : booking,
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

  if (authLoading || (isAuthenticated && loading)) {
    return <LoadingScreen message="Loading your bookings…" />;
  }

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to see your bookings"
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
            Track your consultation requests and manage your upcoming sessions.
          </p>
        </header>

        {error ? (
          <ErrorState
            title="Bookings didn't load"
            message={error}
            onRetry={loadBookings}
          />
        ) : bookings.length === 0 ? (
          <NoDataState
            variant="panel"
            icon={Icons.book}
            title="No bookings yet"
            description="Find an expert who understands your situation and book your first session."
            action={{
              label: "Find an Expert",
              to: "/consult/book",
              icon: <Icons.search className="h-4 w-4" />,
            }}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const id = booking._id || booking.id;

              return (
                <BookingCard
                  key={id}
                  booking={booking}
                  confirming={confirmingId === id}
                  cancelling={cancellingId === id}
                  onConfirm={() => setConfirmingId(id)}
                  onDismissConfirm={() => setConfirmingId(null)}
                  onCancel={handleCancel}
                />
              );
            })}
          </div>
        )}

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
