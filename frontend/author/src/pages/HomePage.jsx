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
import StoriesForYou from "../components/home/StoriesForYou";
import InfoCards from "../components/home/InfoCards";
import toast from "react-hot-toast";

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
