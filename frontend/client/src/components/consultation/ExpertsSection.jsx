import { CoachCard } from "./CoachCard";

export function ExpertsSection({
  categories,
  activeCategory,
  setActiveCategory,
  visibleCoaches,
}) {
  return (
    <section id="experts" className="scroll-mt-24 space-y-10 pt-4">
      {/* Header */}
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
          Meet Your Experts
        </p>
        <h2 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
          Choose your coach
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
          Browse verified coaches across every area of life and book a one-on-one session in just a few clicks.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
            activeCategory === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/80 bg-card text-muted-foreground hover:border-accent/50 hover:text-accent"
          }`}
        >
          All Coaches
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/80 bg-card text-muted-foreground hover:border-accent/50 hover:text-accent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Coach Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCoaches.map((coach) => {
          const category = categories.find((c) => c.id === coach.category);
          return (
            <CoachCard key={coach.id} coach={coach} category={category} />
          );
        })}
      </div>

      {/* Empty State */}
      {visibleCoaches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No coaches in this category yet. Check back soon!
          </p>
        </div>
      )}
    </section>
  );
}