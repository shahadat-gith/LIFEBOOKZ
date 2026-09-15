import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../../icons";
import toast from "react-hot-toast";

/**
 * Testimonial form for experts — one testimonial per expert, editable
 * until deleted. Shows the expert's existing testimonial when present.
 */
export default function TestimonialForm({ onSubmitted }) {
  const { expert, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState(null);
  const [loadedMine, setLoadedMine] = useState(false);

  // Load the expert's existing testimonial (if any) once.
  useEffect(() => {
    if (!isAuthenticated || loadedMine) return;
    api
      .get("/testimonials/me")
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setMine(data);
          setMessage(data.message || "");
          setRating(data.rating || 5);
        }
      })
      .catch(() => {})
      .finally(() => setLoadedMine(true));
  }, [isAuthenticated, loadedMine]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please write a short testimonial before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/testimonials", {
        message: message.trim(),
        rating,
      });
      setMine(res.data?.data || null);
      toast.success("Thank you! Your testimonial is now live.");
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

  async function handleDelete() {
    if (!mine) return;
    try {
      await api.delete(`/testimonials/${mine.id}`);
      setMine(null);
      setMessage("");
      setRating(5);
      toast.success("Your testimonial has been removed.");
      if (onSubmitted) onSubmitted();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        "Failed to remove your testimonial.";
      toast.error(msg);
    }
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">
          Share Your Experience
        </h3>
        <p className="text-sm text-muted-foreground">
          {isAuthenticated
            ? "Tell the community what consulting on Lifebookz is like — your words help future clients and fellow experts."
            : "Join our expert community and share how Lifebookz supports your practice."}
        </p>
      </div>

      {isAuthenticated ? (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-2xl bg-card border border-border/60 shadow-xs"
        >
          {mine && (
            <p className="mb-4 text-xs font-medium text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2">
              You already shared a testimonial — editing it will update your
              existing entry.
            </p>
          )}

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
            placeholder="Share how consulting on Lifebookz has been for you"
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground">
                Signed in as{" "}
                <span className="font-semibold text-foreground">
                  {expert?.fullName || "you"}
                </span>
              </span>
              {mine && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-[11px] font-semibold text-destructive hover:underline"
                >
                  Delete my testimonial
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.starSolid className="h-4 w-4" />
              )}
              {submitting
                ? "Sharing..."
                : mine
                  ? "Update Testimonial"
                  : "Share Testimonial"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-8 rounded-2xl bg-card border border-border/60 text-center shadow-xs">
          <Icons.starSolid className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-5">
            Sign in to share your experience with the community.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
          >
            Sign in to share
          </Link>
        </div>
      )}
    </div>
  );
}
