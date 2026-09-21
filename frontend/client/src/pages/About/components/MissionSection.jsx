import { MISSION_PARAGRAPHS } from "../data";

/** Why the platform exists, next to a framed photograph. */
export default function MissionSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Our Mission
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Every memory deserves a home.
          </h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
            {MISSION_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Framed image */}
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-28 w-28 rounded-[var(--radius-xl)] bg-accent/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-card p-4 shadow-md">
            <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
              <img
                src="/hero.png"
                alt="Families and memories preserved on Lifebookz"
                className="h-[420px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-6 right-6 font-display text-lg font-semibold text-white">
                &quot;The memories you keep become the legacy you leave.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
