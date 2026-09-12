import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import Icons from "../../icons";
import { fadeUp } from "./utils";

const HERO_IMAGE = "/hero.png";

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? "show" : "hidden";

  const authorPortalUrl =
    import.meta.env.VITE_AUTHOR_PORTAL || "https://author.lifebookz.com";

  return (
    <section className="relative overflow-hidden bg-background">
      {/*
        Split background wash — the left half carries the deep navy brand
        tint while the right half warms up with the coral accent. Kept on
        every breakpoint so mobile shows the same two-tone treatment as the
        desktop layout.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-primary/[0.07] via-primary/[0.03] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent/[0.1] via-accent/[0.04] to-transparent" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent lg:block" />
      </div>

      {/* Background Decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-accent/8 blur-3xl lg:-right-20 lg:-top-20 lg:h-[620px] lg:w-[620px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl lg:h-[500px] lg:w-[500px]"
      />

      {/* Hero Container */}
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16 xl:py-20">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 xl:gap-16">
          {/* Left Hero Copy */}
          <div className="relative z-10 w-full min-w-0">
            {/* Headline */}
            <motion.h1
              custom={0.15}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-3 w-full font-display text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-primary sm:mt-4 sm:text-4xl md:text-5xl lg:mt-6 lg:max-w-[520px] lg:text-6xl lg:leading-[1.03] xl:text-7xl"
            >
              Every life
              <br />
              has a{" "}
              <span className="relative inline-block">
                story
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 9"
                  className="absolute -bottom-1 left-0 w-full text-accent/80 sm:-bottom-2"
                  fill="none"
                >
                  <path
                    d="M3 6.5 C22 2.5, 42 2, 60 5 S98 8.5 117 3.5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-accent">.</span>
            </motion.h1>

            {/* Paragraph 1 */}
            <motion.p
              custom={0.28}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-3 w-full text-xs leading-relaxed text-muted-foreground sm:mt-5 sm:text-sm sm:leading-6 lg:mt-6 lg:max-w-[470px] lg:text-lg lg:leading-8"
            >
              Preserve the story of your life—your memories, childhood, school
              and college experiences, relationships, challenges, and life
              lessons—and help others learn from your experiences and wisdom.
            </motion.p>

            {/* Mobile Image Insertion (Only visible on mobile screens below lg) */}
            <motion.div
              initial={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.85,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative my-6 flex w-full items-center justify-center lg:hidden"
            >
              <div
                aria-hidden="true"
                className="absolute right-[2%] top-[8%] aspect-square w-[85%] rounded-full bg-accent/8 blur-2xl sm:w-[90%]"
              />

              <div
                aria-hidden="true"
                className="absolute left-[8%] top-[8%] text-accent/50"
              >
                <Icons.sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div
                aria-hidden="true"
                className="absolute right-[8%] top-[18%] text-accent/40"
              >
                <Icons.sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>

              <div className="relative z-10 w-full">
                <img
                  src={HERO_IMAGE}
                  alt="Lifebookz — preserve your life's story"
                  className="block h-auto w-full object-contain drop-shadow-[0_25px_35px_rgba(15,23,42,0.08)]"
                />
              </div>
            </motion.div>

            {/* Paragraph 2 — highlighted "Imagine..." callout */}
            <motion.div
              custom={0.28}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-3 w-full rounded-2xl border-l-4 border-accent bg-gradient-to-r from-accent/[0.14] via-accent/[0.06] to-transparent px-4 py-3 shadow-xs sm:mt-5 sm:px-6 sm:py-5 lg:mt-6 lg:max-w-[470px] lg:px-7 lg:py-6"
            >
              <p className="flex items-start gap-2.5 text-xs leading-relaxed text-foreground/85 sm:text-sm sm:leading-6 lg:gap-3 lg:text-lg lg:leading-8">
                <Icons.sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span>
                  <span className="font-display font-extrabold italic text-accent">
                    Imagine
                  </span>{" "}
                  your childhood, your relationships, the last time you cried,
                  your happiest memory, and all the moments that shaped who you
                  are...
                </span>
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              custom={0.4}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-5 flex items-center gap-2 sm:mt-7 sm:gap-4 lg:mt-9 lg:gap-5"
            >
              <a
                href={authorPortalUrl}
                className="group relative inline-flex shrink-0 items-center gap-2 rounded-full bg-primary py-2 px-3 text-xs font-bold text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 lg:text-sm"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-3/4 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-all duration-700 group-hover:left-[120%]"
                />
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:rotate-90 sm:h-6 sm:w-6 lg:h-7 lg:w-7">
                  <Icons.plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                </span>
                <span>Begin Your Lifebook</span>
              </a>

              <Link
                to="/feed"
                className="group relative inline-flex shrink-0 items-center gap-2 rounded-full bg-primary py-2 px-3 text-xs font-bold text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 lg:text-sm"
              >
                <span>Explore Stories</span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent group-hover:text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7">
                  <Icons.arrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Desktop Right Hero Visual (Hidden on mobile, visible on lg screens and up) */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative hidden w-full items-center justify-center lg:flex"
          >
            <div
              aria-hidden="true"
              className="absolute right-[2%] top-[8%] aspect-square w-[85%] rounded-full bg-accent/8 blur-2xl lg:right-[-5%] lg:top-[4%] lg:w-[95%] xl:w-[100%]"
            />

            <div
              aria-hidden="true"
              className="absolute left-[8%] top-[8%] text-accent/50"
            >
              <Icons.sparkles className="lg:h-7 lg:w-7" />
            </div>

            <div
              aria-hidden="true"
              className="absolute right-[8%] top-[18%] text-accent/40"
            >
              <Icons.sparkles className="lg:h-6 lg:w-6" />
            </div>

            {/* Main Hero Illustration */}
            <div className="relative z-10 w-full lg:w-[112%] xl:w-[115%]">
              <img
                src={HERO_IMAGE}
                alt="Lifebookz — preserve your life's story"
                className="block h-auto w-full object-contain drop-shadow-[0_25px_35px_rgba(15,23,42,0.08)] transition-transform duration-700 hover:scale-[1.015]"
              />
            </div>

            {/* Floating Memory Card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[7%] left-[1%] z-20 hidden rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm lg:block"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-[10px] font-semibold text-primary">
                  Your story matters
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;