import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import useMyStories from "../hooks/useMyStories";
import useStoryFeed from "../hooks/useStoryFeed";
import * as storyClient from "../utils/client";

import TestimonialForm from "../components/home/TestimonialForm";
import TestimonialsSection from "../components/home/TestimonialsSection";
import GreetingHero from "../components/home/GreetingHero";
import WritingGuide from "../components/home/WritingGuide";
import DraftsList from "../components/home/DraftsList";
import StoriesForYou from "../components/home/StoriesForYou";
import InfoCards from "../components/home/InfoCards";
import toast from "react-hot-toast";

/**
 * Author home.
 *
 * The shell renders from the session alone — name and greeting appear as soon
 * as the author is known. Drafts and the community feed each load on their own
 * and fill in with skeletons, so a slow feed never holds up the page.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { author, isLoading: authLoading } = useAuth();
  const authorId = author?.id || author?._id || null;

  const drafts = useMyStories({ enabled: Boolean(authorId) });
  const feed = useStoryFeed({ excludeAuthorId: authorId });

  const [deletingId, setDeletingId] = useState(null);
  const [testimonialKey, setTestimonialKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !author) {
      navigate("/login", { replace: true });
    }
  }, [author, authLoading, navigate]);

  // Surface load failures instead of silently showing nothing.
  useEffect(() => {
    if (drafts.error) toast.error("We couldn't load your drafts.");
  }, [drafts.error]);

  async function handleDeleteDraft(e, book) {
    e.stopPropagation();
    const bookId = book.id || book._id;

    if (book.status === "published") {
      toast.error("Unpublish the lifebook first to delete it.");
      return;
    }
    if (!window.confirm(`Delete draft "${book.title || "Untitled"}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(bookId);
    try {
      await storyClient.remove(bookId);
      drafts.setStories((prev) => prev.filter((b) => (b.id || b._id) !== bookId));
      toast.success("Draft deleted");
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || !author) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 pb-28 md:pb-12">
      {/* ═══════════ Greeting ═══════════ */}
      <GreetingHero author={author} />

      {/* ═══════════ How to write your story ═══════════ */}
      <WritingGuide onStart={() => navigate("/stories/new")} />

      {/* ═══════════ My drafts (with delete) ═══════════ */}
      <DraftsList
        books={drafts.stories}
        loading={drafts.loading}
        onDelete={handleDeleteDraft}
        deletingId={deletingId}
      />

      {/* ═══════════ Stories For You (other authors only) ═══════════ */}
      <StoriesForYou
        stories={feed.stories}
        loading={feed.loading}
        error={feed.error}
        onRetry={feed.reload}
      />

      {/* ═══════════ Why write + Writing tips ═══════════ */}
      <InfoCards />

      {/* ═══════════ Share your experience ═══════════ */}
      <div className="mb-10">
        <TestimonialForm onSubmitted={() => setTestimonialKey((k) => k + 1)} />
      </div>

      {/* ═══════════ Community testimonials ═══════════ */}
      <TestimonialsSection refreshKey={testimonialKey} />
    </div>
  );
}
