import { useState } from "react";
import { coachCategories, getCoachesByCategory } from "../data/coaches";
import { HeroSection } from "../components/consultation/HeroSection";
import { CategoryGrid } from "../components/consultation/CategoryGrid";
import { ExpertsSection } from "../components/consultation/ExpertsSection";

export default function Consultation() {
  const [activeCategory, setActiveCategory] = useState("all");
  const visibleCoaches = getCoachesByCategory(activeCategory);

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
    document.getElementById("experts")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/20 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl space-y-24">
        {/* Hero Section */}
        <HeroSection />

        {/* Category Selector Grid */}
        <CategoryGrid
          categories={coachCategories}
          onSelectCategory={handleCategorySelect}
        />

        {/* Experts Directory Section */}
        <ExpertsSection
          categories={coachCategories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          visibleCoaches={visibleCoaches}
        />

        {/* Footer Accent */}
        <footer className="border-t border-border/50 py-10 text-center">
          <p className="font-display text-xl font-semibold italic text-muted-foreground sm:text-2xl">
            Better Decisions. A Brighter You<span className="text-accent">.</span>
          </p>
        </footer>
      </div>
    </div>
  );
}