import { Link } from "react-router-dom";
import { AUTHOR_PORTAL_URL } from "../data";

/** The closing invitation: start writing, or go read. */
export default function AboutCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-primary">
      <div
        className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[560px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          Your story matters.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-primary-foreground/70">
          Start preserving the moments that made you — today. The people you
          love will thank you forever.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={AUTHOR_PORTAL_URL}
            className="rounded-[var(--radius-full)] bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-md transition-transform hover:-translate-y-0.5"
          >
            Write your story
          </Link>
          <Link
            to="/feed"
            className="rounded-[var(--radius-full)] border border-primary-foreground/30 px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:border-primary-foreground/60 hover:bg-primary-foreground/10"
          >
            Explore stories
          </Link>
        </div>
      </div>
    </section>
  );
}
