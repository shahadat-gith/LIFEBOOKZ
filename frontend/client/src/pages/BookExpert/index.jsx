import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import SignInPrompt from "../../components/common/SignInPrompt";
import ErrorState from "../../components/common/ErrorState";
import LoadingScreen from "../../components/common/LoadingScreen";

import * as consultApi from "../../api/consultation";
import { readConsultContext } from "./utils";

import ExpertSidebar from "./components/ExpertSidebar";
import BookingForm from "./components/BookingForm";
import RequestSuccess from "./components/RequestSuccess";

/**
 * Book a session with one expert — simplified flow.
 *
 * 1. The user describes their problem and sends the request.
 * 2. `POST /consult/requests` creates a PENDING consultation and emails
 *    the expert (problem + category + dashboard CTA).
 * 3. The confirmation screen explains the next step: the expert confirms →
 *    the user gets the room link by email → payment happens at the door.
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

  const [expert, setExpert] = useState(null);
  const [loadingExpert, setLoadingExpert] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [problem, setProblem] = useState(context.problem || "");
  const [category, setCategory] = useState(context.category || "");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const expertRes = await api.get(`/experts/${expertId}`);
        if (!active) return;
        setExpert(expertRes.data.data);
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

  const handleRequest = async (event) => {
    event.preventDefault();

    if (problem.trim().length < 10) {
      toast.error("Please describe your problem in at least 10 characters.");
      return;
    }
    if (!category) {
      toast.error("Please pick a category.");
      return;
    }

    setSubmitting(true);

    try {
      const consultation = await consultApi.createRequest({
        expertId: expert.id || expert._id,
        problem: problem.trim(),
        category,
        notes: notes.trim(),
      });

      setCreated(consultation);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "Could not send your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExpert) return <LoadingScreen message="Loading expert…" />;

  // Requests are tied to an account.
  if (!authLoading && !isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to request a session"
        description="Sessions are tied to your account so you and your expert can keep track of them. Log in to continue."
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

  if (created) {
    return <RequestSuccess consultation={created} expert={expert} />;
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
            problem={problem}
            onProblemChange={setProblem}
            category={category}
            onCategoryChange={setCategory}
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            onSubmit={handleRequest}
          />
        </div>
      </div>
    </div>
  );
}
