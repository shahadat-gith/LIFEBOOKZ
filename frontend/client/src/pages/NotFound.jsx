import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Page not found
      </span>

      <h1 className="mt-4 font-display text-7xl font-bold text-foreground sm:text-8xl">
        404
      </h1>

      <p className="mt-4 max-w-sm text-base leading-7 text-muted-foreground">
        This page isn't part of the archive. It may have been moved, or
        never existed.
      </p>

      <Link
        to="/"
        className="mt-8 rounded-[var(--radius-full)] bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
      >
        Back to home
      </Link>
    </section>
  );
}

export default NotFound;