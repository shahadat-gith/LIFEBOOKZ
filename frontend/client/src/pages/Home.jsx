import { useEffect, useState } from "react";
import api from "../config/axios";

import {
  Hero,
  TestimonialsSection,
  LatestStories
} from "../components/home";

export function HomePage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/stories", { params: { limit: 8 } })
      .then((res) => {
        if (!cancelled) {
          const data = res.data?.data || res.data;
          setStories(data?.stories || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to fetch stories:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden pt-8 pb-16 md:py-20">
        <div 
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl -z-10" 
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Hero />
        </div>
      </section>

      {/* SECTION DIVIDER WITH GOLD GLOW */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4">
        <div className="h-[1px] w-full bg-border" />
        <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] w-32 h-[1px] bg-accent/60 shadow-[0_0_12px_var(--color-accent)]" />
      </div>

      {/* SECTION 2: LATEST STORIES (Alternating Surface Tier) */}
      <section className="py-16 md:py-24 bg-card/60  shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LatestStories stories={stories} loading={loading} />
        </div>
      </section>

      {/* SECTION 3: TESTIMONIALS */}
      <section className="py-16 md:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TestimonialsSection />
        </div>
      </section>
    </div>
  );
}

export default HomePage;