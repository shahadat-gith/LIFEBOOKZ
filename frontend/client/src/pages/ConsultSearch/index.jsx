import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../config/axios";
import { apiErrorMessage } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import SignInPrompt from "../../components/common/SignInPrompt";
import ConsultHeader from "./components/ConsultHeader";
import ConsultForm from "./components/ConsultForm";
import MatchResults from "./components/MatchResults";
import { buildProblem, saveConsultContext, validateConsult } from "./utils";

/**
 * Expert matching: describe a problem, pick a category, and see the experts
 * who fit — best first.
 *
 * The page owns the brief and the matches; the form and the results are
 * layout only.
 */
export default function ConsultSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sessionType, setSessionType] = useState("video");
  const [details, setDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [experts, setExperts] = useState([]);
  const [matched, setMatched] = useState(true);
  const [error, setError] = useState("");

  /* ---------- Clear the error as soon as the form is touched ---------- */
  function change(setter) {
    return (value) => {
      if (error) setError("");
      setter(value);
    };
  }

  /* ---------- Ask the matcher for experts ---------- */
  async function handleSubmit(event) {
    event.preventDefault();

    const invalid = validateConsult({ problem, category });
    if (invalid) {
      setError(invalid);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/consult/match", {
        problem: buildProblem(problem, details),
        category,
        limit: 5,
      });

      const found = res.data?.data?.experts || [];
      setExperts(found);
      setMatched(res.data?.data?.matched !== false);
      setSearched(true);

      if (found.length === 0) {
        toast.error("No experts matched. Try describing your problem differently.");
      }

      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (err) {
      toast.error(
        apiErrorMessage(
          err,
          "We couldn't reach our experts right now. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Book one of the matches ---------- */
  function handleBook(expert) {
    const expertId = expert.id || expert._id;
    const brief = {
      problem: problem.trim(),
      category,
      sessionType,
      details: details.trim(),
    };

    // Carry the consult context so the booking form is prefilled.
    saveConsultContext(brief);

    navigate(`/consult/book/${expertId}`, {
      state: { problem: brief.problem, category, sessionType },
    });
  }

  /* ---------- Matching needs an account ---------- */
  if (!authLoading && !isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to find your expert"
        description="We match you with experts using your consult form and keep your bookings in one place, so an account is needed. Log in and we'll take it from there."
        showRegister
      />
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <ConsultHeader />

        <ConsultForm
          problem={problem}
          onProblemChange={change(setProblem)}
          category={category}
          onCategoryChange={change(setCategory)}
          sessionType={sessionType}
          onSessionTypeChange={change(setSessionType)}
          details={details}
          onDetailsChange={change(setDetails)}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
        />

        {searched && (
          <div ref={resultsRef}>
            <MatchResults experts={experts} matched={matched} onBook={handleBook} />
          </div>
        )}
      </div>
    </div>
  );
}
