import { VALUES } from "../data";

/** The four things the product stands for, as cards. */
export default function ValuesSection() {
  return (
    <section className="relative border-y border-border/60 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            What We Stand For
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            The values behind every story
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => {
            const Icon = value.icon;

            return (
              <div
                key={value.title}
                className="group rounded-[var(--radius-xl)] border border-border/60 bg-background p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
