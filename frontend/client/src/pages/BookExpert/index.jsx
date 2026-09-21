import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import SignInPrompt from "../../components/common/SignInPrompt";
import ErrorState from "../../components/common/ErrorState";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getAvailableSlots, getCategoryLabel } from "../../data/coaches";

import ExpertSidebar from "./components/ExpertSidebar";
import BookingForm from "./components/BookingForm";
import BookingSuccess from "./components/BookingSuccess";
import { readConsultContext } from "./utils";

/**
 * Book a session with one expert.
 *
 * The page owns the booking draft (it is sent as one request and then shown
 * back on the confirmation screen); the sidebar, the form and the
 * confirmation are their own components.
 */
export default function BookExpert() {
  const { expertId } = useParams();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Context carried over from the consult matching form.
  const context = useMemo(() => {
    const stored = readConsultContext();
    return { ...stored, ...(location.state || {}) };
  }, [location.state]);

  const { timeSlots, days } = useMemo(() => getAvailableSlots(), []);

  const [expert, setExpert] = useState(null);
  const [loadingExpert, setLoadingExpert] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [problem, setProblem] = useState(context.problem || "");
  const [category, setCategory] = useState(context.category || "");
  const [sessionType, setSessionType] = useState(
    context.sessionType || "video",
  );
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await api.get(`/experts/${expertId}`);
        if (!active) return;
        setExpert(res.data.data);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoadingExpert(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [expertId]);

  // Prefill the category from the expert when the reader arrived directly.
  useEffect(() => {
    if (!expert || category || context.category) return;
    const first = expert.categories?.[0];
    if (first) setCategory(first);
  }, [expert, category, context.category]);

  const handleBooking = async (event) => {
    event.preventDefault();

    if (problem.trim().length < 10) {
      toast.error("Please describe your problem in at least 10 characters.");
      return;
    }

    if (!category) {
      toast.error("Please pick a category.");
      return;
    }

    if (!time) {
      toast.error("Please pick a time slot.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post("/consult/bookings", {
        expertId: expert.id || expert._id,
        problem: problem.trim(),
        category,
        sessionType,
        date,
        time,
        notes: notes.trim(),
      });

      setBooking(res.data.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "Booking failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExpert) return <LoadingScreen message="Loading expert…" />;

  // Bookings are tied to an account.
  if (!authLoading && !isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to book a session"
        description="Sessions are tied to your account so you and your expert can keep track of them. Log in to continue with this booking."
      />
    );
  }

  if (notFound || !expert) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
        <div className="mx-auto max-w-xl">
          <ErrorState
            title="Expert not found"
            message="We couldn't find the expert you're looking for. Start a fresh search to find the right match."
          />
          <div className="flex justify-center">
            <Link
              to="/consult/book"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              <Icons.search className="h-4 w-4" />
              Find an expert
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (booking) {
    return (
      <BookingSuccess
        expert={expert}
        sessionType={sessionType}
        date={date}
        time={time}
        category={category || expert.categories?.[0]}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          to="/consult/book"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-accent"
        >
          <Icons.arrowLeft className="h-4 w-4" />
          Back to expert search
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <ExpertSidebar expert={expert} />

          <BookingForm
            expert={expert}
            days={days}
            timeSlots={timeSlots}
            problem={problem}
            onProblemChange={setProblem}
            category={category}
            onCategoryChange={setCategory}
            sessionType={sessionType}
            onSessionTypeChange={setSessionType}
            date={date}
            onDateChange={(next) => {
              setDate(next);
              setTime("");
            }}
            time={time}
            onTimeChange={setTime}
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            onSubmit={handleBooking}
          />
        </div>
      </div>
    </div>
  );
}
