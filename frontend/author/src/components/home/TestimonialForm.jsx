import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import toast from "react-hot-toast";

export default function TestimonialForm({ onSubmitted }) {
  const { author, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please write a short testimonial before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/testimonials", {
        message: message.trim(),
        rating,
      });
      toast.success("Thank you! Your testimonial is now live.");
      setMessage("");
      setRating(5);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        "Failed to submit your testimonial.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-2">
          Share Your Experience
        </h3>
        <p className="text-sm text-muted-foreground">
          {isAuthenticated
            ? "Tell writers and readers what the Lifebookz author journey means to you."
            : "Join our community of authors and share how Lifebookz has helped your writing."}
        </p>
      </div>

      {isAuthenticated ? (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-xl bg-card border border-border/60 shadow-xs"
        >
          {/* Star rating picker */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <span className="text-xs font-medium text-muted-foreground mr-2">
              Your rating:
            </span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                {n <= activeRating ? (
                  <Icons.starSolid className="h-6 w-6 text-amber-400" />
                ) : (
                  <Icons.starRegular className="h-6 w-6 text-muted-foreground/40" />
                )}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Share how writing on Lifebookz has helped you reach readers..."
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <span className="text-[11px] text-muted-foreground">
              Signed in as{" "}
              <span className="font-semibold text-foreground">
                {author?.fullName || "you"}
              </span>
            </span>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.starSolid className="h-4 w-4" />
              )}
              {submitting ? "Sharing..." : "Share Testimonial"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-8 rounded-xl bg-card border border-border/60 text-center shadow-xs">
          <Icons.starSolid className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-5">
            Sign in to share your experience with the community.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Icons.login className="h-4 w-4" />
            Sign in to share
          </Link>
        </div>
      )}
    </div>
  );
}
