import { useState } from "react";
import { Icons } from "../../../icons";
import { initials } from "../utils";

const RATING_PROMPTS = {
  1: "Not helpful",
  2: "Below expectations",
  3: "Okay",
  4: "Helpful",
  5: "Excellent session",
};

/**
 * Rate a completed session — 1–5 stars plus an optional review.
 * The backend enforces one rating per consultation; the dialog just collects
 * it.
 */
export default function RatingDialog({ consultation, onClose, onSubmit }) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const expert = consultation.expert;
  const active = hovered || score;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!score) return;

    setSubmitting(true);
    try {
      await onSubmit(consultation, score, review.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Rate your session"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {expert?.avatar?.url ? (
              <img
                src={expert.avatar.url}
                alt={expert.fullName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border/70"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-xs font-extrabold text-primary-foreground">
                {initials(expert?.fullName || "Expert")}
              </div>
            )}
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Rate your session
              </h2>
              <p className="text-xs text-muted-foreground">
                with {expert?.fullName || "your expert"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </div>

        {/* Stars */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex gap-1.5" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={score === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setScore(value)}
                className="rounded-full p-1 transition-transform hover:scale-110"
              >
                <Icons.starSolid
                  className={`h-8 w-8 transition-colors ${
                    value <= active ? "text-amber-500" : "text-border"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {RATING_PROMPTS[active] || "How was your session?"}
          </p>
        </div>

        {/* Review */}
        <textarea
          rows={3}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share a few words about the session (optional)"
          className="mt-5 w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />

        <button
          type="submit"
          disabled={!score || submitting}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.checkCircle className="h-4 w-4" />
          )}
          Submit rating
        </button>
      </form>
    </div>
  );
}
