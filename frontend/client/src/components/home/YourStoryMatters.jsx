import { Link } from "react-router-dom";
import Icons from "../../icons";

const POINTS = [
  "It's worth remembering.",
  "It can help someone.",
  "It can inspire generations.",
  "It's never too late to begin.",
];

function BookVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex h-72 w-full max-w-[300px] items-center justify-center select-none"
    >
      {/* Ambient glow behind the book */}
      <div className="absolute h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Page stack (right edge) */}
      <div className="absolute right-[62px] top-[38px] h-[176px] w-3 rounded-r-lg bg-muted shadow-sm" />
      <div className="absolute right-[66px] top-[32px] h-[188px] w-3 rounded-r-lg bg-card border border-border/60" />

      {/* Front cover */}
      <div className="relative h-60 w-44 rotate-[-4deg] rounded-r-lg rounded-l-md bg-primary shadow-2xl shadow-primary/30 transition-transform duration-500 hover:rotate-0">
        {/* spine */}
        <div className="absolute inset-y-0 left-0 w-3 rounded-l-md bg-black/15" />
        <div className="absolute inset-y-0 left-3 w-px bg-white/10" />

        {/* cover content */}
        <div className="flex h-full flex-col items-center justify-between px-5 py-6 pl-7 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-200/80">
            Lifebookz
          </p>

          <div className="flex flex-col items-center gap-2">
            <Icons.book className="h-9 w-9 text-white/90" />
            <p className="font-display text-base font-extrabold leading-snug text-white">
              My
              <br />
              Lifebook
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-blue-200/60">
              Vol. I
            </p>
          </div>

          <p className="text-[8px] font-medium uppercase tracking-widest text-blue-200/60">
            Begun with one memory
          </p>
        </div>
      </div>

      {/* Bookmark ribbon */}
      <div className="absolute -right-4 top-5 rotate-[4deg]">
        <div className="h-24 w-3.5 rounded-b-[5px] bg-accent shadow-md shadow-accent/30" />
        <div className="mx-auto -mt-px h-0 w-0 border-l-[7px] border-r-[7px] border-t-[8px] border-l-transparent border-r-transparent border-t-accent" />
      </div>

      {/* Floating engagement chip */}
      <div className="absolute -left-2 bottom-2 flex -rotate-3 items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 shadow-lg shadow-primary/10">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50">
          <Icons.heartSolid className="h-3.5 w-3.5 text-rose-500" />
        </span>
        <div>
          <p className="text-[10px] font-bold text-foreground">Stories that heal</p>
          <p className="text-[9px] text-muted-foreground">read by thousands</p>
        </div>
      </div>

      <Icons.sparkles className="absolute -top-1 right-6 h-5 w-5 text-amber-400/80" />
    </div>
  );
}

export function YourStoryMatters() {
  const authorPortalUrl =
    import.meta.env.VITE_AUTHOR_PORTAL || "https://author.lifebookz.com";

  return (
    <section className="border-t border-border/60 bg-background py-12 select-none sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-md shadow-primary/[0.04]">
          {/* decorative tints */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/[0.07] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-accent/[0.06] blur-3xl"
          />

          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-6 lg:p-14">
            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                <Icons.plus className="h-3 w-3" />
                Why Lifebookz
              </span>

              <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                Your story matters.
              </h2>

              <p className="mt-3 max-w-md text-[15px] leading-7 text-muted-foreground">
                The moments you lived through — the struggles, the joys, the
                lessons — deserve more than to fade away.
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-x-8">
                {POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-2.5">
                    <Icons.checkCircle className="h-5 w-5 shrink-0 text-blue-500" />
                    <span className="text-[15px] font-semibold text-foreground/80">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  to={authorPortalUrl}
                  className="group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-colors group-hover:bg-white/25">
                    <Icons.plus className="h-4 w-4 text-white" />
                  </span>
                  Start Your Lifebook
                </Link>

                <Link
                  to="/trending"
                  className="text-[15px] font-bold text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-[6px] transition-colors hover:text-blue-700"
                >
                  Read inspiring lives
                </Link>
              </div>
            </div>

            {/* Visual */}
            <BookVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

export default YourStoryMatters;
