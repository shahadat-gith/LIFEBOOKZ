import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../icons";
import Button from "../components/ui/Button";
import {
  getAvailableSlots,
  coachCategories,
  getCategoryLabel,
} from "../data/coaches";

const SESSION_TYPES = [
  {
    id: "video",
    label: "Video Call",
    icon: Icons.videoCamera,
    desc: "Face-to-face on a video call",
  },
  {
    id: "audio",
    label: "Audio Call",
    icon: Icons.phone,
    desc: "Talk over a phone call",
  },
  {
    id: "chat",
    label: "Chat Session",
    icon: Icons.chat,
    desc: "Text-based coaching session",
  },
];

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
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function readConsultContext() {
  try {
    const raw = sessionStorage.getItem("lifebookz-consult-context");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

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
  const [sessionType, setSessionType] = useState(context.sessionType || "video");
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

  // Prefill the category from the expert when the user arrived directly.
  useEffect(() => {
    if (!expert || category) return;
    if (context.category) return;
    const first = expert.categories?.[0];
    if (first) setCategory(first);
  }, [expert, category, context.category]);

  const handleBooking = async (e) => {
    e.preventDefault();

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

  /* ---------- Loading ---------- */
  if (loadingExpert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ---------- Sign-in required (bookings are tied to an account) ---------- */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
        <div className="mx-auto max-w-xl space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icons.lock className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Sign in to book a session
          </h1>
          <p className="text-sm text-muted-foreground">
            Sessions are tied to your account so you and your expert can keep
            track of them. Log in to continue with this booking.
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

  /* ---------- Not found ---------- */
  if (notFound || !expert) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
        <div className="mx-auto max-w-xl space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Icons.exclamationCircle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Expert not found
          </h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t find the expert you&apos;re looking for. Start a
            fresh search to find the right match.
          </p>
          <Link
            to="/consult/book"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <Icons.search className="h-4 w-4" />
            Find an expert
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = getCategoryLabel(category || expert.categories?.[0]);

  /* ---------- Success ---------- */
  if (booking) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground md:py-24">
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Icons.checkCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
              Booking request sent!
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              {expert.fullName} will review your request and confirm the session
              shortly.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-6 text-left shadow-xs">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              {expert.avatar?.url ? (
                <img
                  src={expert.avatar.url}
                  alt={expert.fullName}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-border/70"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground">
                  {initials(expert.fullName)}
                </div>
              )}
              <div>
                <p className="font-display text-base font-bold text-foreground">
                  {expert.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {expert.expertise}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Icons.chat className="h-4 w-4" />
                  Session
                </dt>
                <dd className="font-semibold text-foreground">
                  {SESSION_TYPES.find((s) => s.id === sessionType)?.label}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Icons.clock className="h-4 w-4" />
                  Date &amp; time
                </dt>
                <dd className="font-semibold text-foreground">
                  {date ? `${formatDate(date)} · ${time}` : time}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Icons.document className="h-4 w-4" />
                  Category
                </dt>
                <dd className="font-semibold text-foreground">
                  {categoryLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-display text-lg font-extrabold text-foreground">
                  {expert.price ? `$${expert.price}` : "Free"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/consult/book"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:w-auto"
            >
              Find another expert
            </Link>
            <Link
              to="/consult"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted sm:w-auto"
            >
              Back to consultation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Booking form ---------- */
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
          {/* Expert sidebar */}
          <aside className="h-fit space-y-5 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
              <div className="flex items-center gap-4">
                {expert.avatar?.url ? (
                  <img
                    src={expert.avatar.url}
                    alt={expert.fullName}
                    className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-border/70"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground">
                    {initials(expert.fullName)}
                  </div>
                )}
                <div>
                  <h1 className="font-display text-xl font-extrabold text-foreground">
                    {expert.fullName}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {expert.expertise}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                {expert.categories?.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1"
                  >
                    {getCategoryLabel(cat)}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                  <Icons.userCheck className="h-3 w-3" />
                  {expert.sessions || 0} sessions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                  <Icons.clock className="h-3 w-3" />
                  {expert.experience || 0} yrs exp
                </span>
              </div>

              {expert.qualification && (
                <p className="mt-4 flex items-start gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Icons.academic className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
                  {expert.qualification}
                </p>
              )}

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {expert.bio}
              </p>

              <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-4">
                <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                  <Icons.starSolid className="h-4 w-4" />
                  {(expert.rating || 0).toFixed(1)}
                </div>
                {expert.languages?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icons.globe className="h-4 w-4" />
                    {expert.languages.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Booking form */}
          <form
            onSubmit={handleBooking}
            className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs sm:p-8"
          >
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Book your session
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share what you need help with and pick a time that works for you.
            </p>

            {/* Problem */}
            <div className="mt-7">
              <label
                htmlFor="booking-problem"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                What would you like help with?
              </label>
              <textarea
                id="booking-problem"
                rows={4}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe your situation so the expert can prepare..."
                className="mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>

            {/* Category */}
            <div className="mt-6">
              <label
                htmlFor="booking-category"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </label>
              <select
                id="booking-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              >
                <option value="">Select a category…</option>
                {coachCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Session type */}
            <fieldset className="mt-7">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Session type
              </legend>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SESSION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const active = sessionType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSessionType(type.id)}
                      className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                        active
                          ? "border-accent bg-accent/[0.06] ring-1 ring-accent/40"
                          : "border-border/70 hover:border-accent/40"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          active
                            ? "bg-accent text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-2.5 text-sm font-bold text-foreground">
                        {type.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                        {type.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Date */}
            <fieldset className="mt-7">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pick a day
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDate(d);
                      setTime("");
                    }}
                    className={`rounded-xl border px-4 py-2.5 text-center transition-all duration-200 ${
                      date === d
                        ? "border-accent bg-accent/[0.06] ring-1 ring-accent/40"
                        : "border-border/70 hover:border-accent/40"
                    }`}
                  >
                    <span className="block text-xs font-bold text-foreground">
                      {formatDate(d)}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Time */}
            <fieldset className="mt-7">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pick a time
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                      time === slot
                        ? "border-accent bg-accent text-white"
                        : "border-border/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Notes */}
            <div className="mt-7">
              <label
                htmlFor="booking-notes"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Additional notes{" "}
                <span className="font-normal normal-case text-muted-foreground/70">
                  (optional)
                </span>
              </label>
              <textarea
                id="booking-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else the expert should know before the session..."
                className="mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>

            {/* Submit */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  {expert.price ? `$${expert.price}` : "Free"}
                </p>
              </div>
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                disabled={!time}
                className="w-full rounded-full px-8 sm:w-auto"
              >
                <Icons.checkCircle className="h-4 w-4" />
                Confirm Booking
              </Button>
            </div>
            {!time && (
              <p className="mt-3 text-center text-xs text-muted-foreground sm:text-right">
                Select a time slot to confirm.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
