import { useState } from "react";
import {
  Hero,
  TestimonialsSection,
  TestimonialForm,
  LatestStories,
} from "../components/home";

export function HomePage() {
  const [testimonialsRefresh, setTestimonialsRefresh] = useState(0);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* SECTION 1: HERO */}
      <Hero />

      {/* SECTION DIVIDER WITH GOLD GLOW */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] w-full bg-border" />
        <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] w-32 h-[1px] bg-accent/60 shadow-[0_0_12px_var(--color-accent)]" />
      </div>

      {/* SECTION 2: LATEST STORIES */}
      <LatestStories />

      {/* SECTION 3: TESTIMONIALS — display + share */}
      <div>
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