import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { coachCategories } from "../data/coaches";
import { Icons } from "../icons";
import { ExpertMatchCard } from "../components/consultation/ExpertMatchCard";

const SESSION_TYPES = [
  { id: "video", label: "Video Call", icon: Icons.videoCamera },
  { id: "audio", label: "Audio Call", icon: Icons.phone },
  { id: "chat", label: "Chat", icon: Icons.chat },
];

const MIN_PROBLEM_LENGTH = 10;

export default function ConsultSearch() {
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

  // Keep the category in sync when arriving from a category card.
  useEffect(() => {
    const fromQuery = searchParams.get("category");
    if (fromQuery) setCategory(fromQuery);
  }, [searchParams]);

  const categoryOptions = useMemo(
    () => coachCategories.map((c) => ({ value: c.id, label: c.label })),
    [],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanProblem = problem.trim();

    if (cleanProblem.length < MIN_PROBLEM_LENGTH) {
      setError(
        `Please describe your problem in at least ${MIN_PROBLEM_LENGTH} characters.`,
      );
      return;
    }

    if (!category) {
      setError("Please pick a category so we can match you accurately.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/consult/match", {
        problem: details.trim()
          ? `${cleanProblem}\n\nAdditional context: ${details.trim()}`
          : cleanProblem,
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
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "We couldn't reach our experts right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (expert) => {
    const expertId = expert.id || expert._id;

    // Carry the consult context so the booking form is prefilled.
    try {
      sessionStorage.setItem(
        "lifebookz-consult-context",
        JSON.stringify({
          problem: problem.trim(),
          category,
          sessionType,
          details: details.trim(),
        }),
      );
    } catch {
      // sessionStorage unavailable — booking form still works.
    }

    navigate(`/consult/book/${expertId}`, {
      state: { problem: problem.trim(), category, sessionType },
    });
  };

  /* ---------- Sign-in required (matching needs an account) ---------- */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
        <div className="mx-auto max-w-xl space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icons.lock className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Sign in to find your expert
          </h1>
          <p className="text-sm text-muted-foreground">
            We match you with experts using your consult form and keep your
            bookings in one place, so an account is needed. Log in and
            we&apos;ll take it from there.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:w-auto"
            >
              <Icons.login className="h-4 w-4" />
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted sm:w-auto"
            >
              <Icons.userAdd className="h-4 w-4" />
              Create an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/20 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Back link */}
        <Link
          to="/consult"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-accent"
        >
          <Icons.arrowLeft className="h-4 w-4" />
          Back to consultation
        </Link>

        {/* Header */}
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Find Your Expert
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Tell us what you&apos;re going through
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Describe your situation and pick a category. We&apos;ll search our
            expert network and show the top matches for you, ranked by rating.
          </p>
        </header>

        {/* Consult form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs sm:p-8"
        >
          {/* Problem */}
          <div>
            <label
              htmlFor="consult-problem"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              What problem are you facing?
            </label>
            <textarea
              id="consult-problem"
              rows={5}
              value={problem}
              onChange={(e) => {
                setProblem(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. I feel stuck in my career and can't decide whether to switch fields or study further..."
              className="mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              The more context you share, the better your matches.
            </p>
          </div>

          {/* Category + session type */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="consult-category"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </label>
              <select
                id="consult-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (error) setError("");
                }}
                className="mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              >
                <option value="">Select a category…</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Preferred session
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SESSION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const active = sessionType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSessionType(type.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-bold transition-all duration-200 ${
                        active
                          ? "border-accent bg-accent/[0.06] text-foreground ring-1 ring-accent/40"
                          : "border-border/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? "text-accent" : ""}`}
                      />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Extra context */}
          <div className="mt-6">
            <label
              htmlFor="consult-details"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Anything else we should know?{" "}
              <span className="font-normal normal-case text-muted-foreground/70">
                (optional)
              </span>
            </label>
            <textarea
              id="consult-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="How long has this been going on? What have you already tried?"
              className="mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              <Icons.exclamationCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              Matches are ranked by expert rating and relevance.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                  Finding your experts…
                </>
              ) : (
                <>
                  <Icons.search className="h-4 w-4" />
                  Find Matching Experts
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <section ref={resultsRef} className="scroll-mt-24 space-y-6 pt-4">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
                {experts.length > 0 ? "Top Matches" : "No Matches"}
              </p>
              <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
                {experts.length > 0
                  ? experts.length === 1
                    ? "1 expert found for you"
                    : `${experts.length} experts found for you`
                  : "We couldn't find a good match"}
              </h2>
              {!matched && experts.length > 0 && (
                <p className="mx-auto max-w-xl text-xs text-muted-foreground">
                  Showing the highest rated experts in this category.
                </p>
              )}
            </div>

            {experts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {experts.map((expert) => (
                  <ExpertMatchCard
                    key={expert.id || expert._id}
                    expert={expert}
                    onBook={handleBook}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Try a broader description or a different category.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
