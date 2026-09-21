import { useNavigate } from "react-router-dom";
import { coachCategories } from "../../data/coaches";
import { HeroSection } from "./components/HeroSection";
import { CategoryGrid } from "./components/CategoryGrid";
import BookSessionCallout from "./components/BookSessionCallout";

/** The consultation landing: what the service is, what it covers, and the way in. */
export default function Consultation() {
  const navigate = useNavigate();

  const handleCategorySelect = (categoryId) => {
    navigate(`/consult/book?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-6xl space-y-24">
        <HeroSection />

        {/* Picks the focus area for the consult form */}
        <CategoryGrid
          categories={coachCategories}
          onSelectCategory={handleCategorySelect}
        />

        <BookSessionCallout onBook={() => navigate("/consult/book")} />

        <footer className="border-t border-border/50 py-10 text-center">
          <p className="font-display text-xl font-semibold italic text-muted-foreground sm:text-2xl">
            Better Decisions. A Brighter You
            <span className="text-accent">.</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
