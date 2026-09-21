import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import useStoryFeed from "../../hooks/useStoryFeed";

import GreetingHero from "./components/GreetingHero";
import WritingGuide from "./components/WritingGuide";
import StoriesForYou from "./components/StoriesForYou";
import InfoCards from "./components/InfoCards";
import TestimonialForm from "./components/TestimonialForm";
import TestimonialsSection from "./components/TestimonialsSection";

/**
 * Home — the author's landing page: a greeting, how to write a story,
 * stories from other authors, why writing matters, and testimonials.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { author, isLoading: authLoading } = useAuth();
  const authorId = author?.id || author?._id || null;
  const feed = useStoryFeed({ excludeAuthorId: authorId });
  const [testimonialKey, setTestimonialKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !author) {
      navigate("/login", { replace: true });
    }
  }, [author, authLoading, navigate]);

  if (authLoading || !author) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 pb-28 md:pb-12">
      {/* ═══════════ Greeting ═══════════ */}
      <GreetingHero author={author} />

      {/* ═══════════ How to write your story ═══════════ */}
      <WritingGuide onStart={() => navigate("/stories/new")} />

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
