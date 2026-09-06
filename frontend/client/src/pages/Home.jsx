import { useState } from "react";
import {
  Hero,
  YourStoryMatters,
  LatestStories,
  TestimonialsSection,
  TestimonialForm,
} from "../components/home";

export function HomePage() {
  const [testimonialsRefresh, setTestimonialsRefresh] = useState(0);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* SECTION 1: HERO */}
      <Hero />

      {/* SECTION 2: LATEST STORIES RAIL */}
      <LatestStories />

      {/* SECTION 3: YOUR STORY MATTERS */}
      <YourStoryMatters />

      {/* SECTION 4: TESTIMONIALS — display + share */}
      <div className="border-t border-border/60">
        <TestimonialsSection refreshKey={testimonialsRefresh} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <TestimonialForm
            onSubmitted={() => setTestimonialsRefresh((k) => k + 1)}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
