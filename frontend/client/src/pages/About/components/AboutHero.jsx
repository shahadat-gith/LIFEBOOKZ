/** The page's opening statement, with its soft accent glow. */
export default function AboutHero() {
  return (
    <header className="relative overflow-hidden border-b border-border/60">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Our Story
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
          About Lifebookz
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          Lifebookz is a home for the stories that shape us. We believe every
          life is worth recording — and that the people who matter most should
          be able to revisit yours, forever.
        </p>
      </div>
    </header>
  );
}
