import { useNavigate } from "react-router-dom";
import { coachCategories } from "../data/coaches";
import { HeroSection } from "../components/consultation/HeroSection";
import { CategoryGrid } from "../components/consultation/CategoryGrid";
import { Icons } from "../icons";

export default function Consultation() {
  const navigate = useNavigate();

  const handleCategorySelect = (categoryId) => {
    navigate(`/consult/book?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/20 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl space-y-24">
        {/* Hero Section */}
        <HeroSection />

        {/* Category Selector Grid — picks the focus area for the consult form */}
        <CategoryGrid
          categories={coachCategories}
          onSelectCategory={handleCategorySelect}
        />

        {/* Book a session call to action */}
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 px-6 py-12 text-center shadow-xs sm:px-10 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.08] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/[0.07] blur-3xl"
          />

          <div className="relative z-10 mx-auto max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Icons.sparkles className="h-3.5 w-3.5" />
              Expert Consultancy
            </span>

            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Tell us what&apos;s on your mind
            </h2>

            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              Share your situation, pick a category, and we&apos;ll match you
              with the best experts for your concern. Compare them and book the
              session that feels right.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/consult/book")}
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
              >
                <Icons.chat className="h-4 w-4" />
                <span>Book a Session with an Expert</span>
                <Icons.arrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>

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
