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
      {/* Background Decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-accent/8 blur-3xl lg:-right-20 lg:-top-20 lg:h-[620px] lg:w-[620px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-[300px] w-[300px] rounded-full bg-accent/5 blur-3xl lg:h-[500px] lg:w-[500px]"
      />

      {/* Hero Container */}
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16 xl:py-20">
        <div className="grid grid-cols-[1fr_1fr] items-center gap-3 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 xl:gap-16">
          {/* Left Hero Copy */}
          <div className="relative z-10 min-w-0">
            {/* Headline */}
            <motion.h1
              custom={0.15}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-3 max-w-[520px] font-display text-[25px] font-extrabold leading-[1.02] tracking-[-0.04em] text-primary sm:mt-4 sm:text-4xl md:text-5xl lg:mt-6 lg:text-6xl lg:leading-[1.03] xl:text-7xl"
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

            {/* Description */}
            <motion.p
              custom={0.28}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-3 max-w-[470px] text-[10px] leading-[1.55] text-muted-foreground sm:mt-5 sm:text-sm sm:leading-6 lg:mt-6 lg:text-lg lg:leading-8"
            >
              Preserve the story of your life—your memories, childhood, school
              and college experiences, relationships, challenges, and life
              lessons—and help others learn from your experiences and wisdom.
            </motion.p>

            <motion.p
              custom={0.28}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-3 max-w-[470px] rounded-2xl bg-accent/5 px-2 py-2 text-[10px] leading-[1.65] text-muted-foreground sm:mt-5 sm:px-6 sm:py-5 sm:text-sm sm:leading-6 lg:mt-6 lg:px-7 lg:py-6 lg:text-lg lg:leading-8"
            >
              Imagine your childhood, your relationships, the last time you
              cried, your happiest memory, and all the moments that shaped who
              you are...
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              custom={0.4}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-5 flex flex-col items-start gap-3 sm:mt-7 sm:flex-row sm:items-center sm:gap-4 lg:mt-9 lg:gap-5"
            >
              <a
                href={authorPortalUrl}
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-primary py-2 pl-2 pr-4.5 text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:gap-3 sm:py-2.5 sm:pl-2.5 sm:pr-6 sm:text-xs lg:py-3 lg:pl-3 lg:pr-8 lg:text-sm"
              >
                {/* Sweeping shine on hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-3/4 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-all duration-700 ease-out group-hover:left-[120%]"
                />
                <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/40 transition-transform duration-300 group-hover:rotate-90 sm:h-7 sm:w-7 lg:h-9 lg:w-9">
                  <Icons.plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-[18px] lg:w-[18px]" />
                </span>
                <span className="relative">Begin Your Lifebook</span>
              </a>

              <Link
                to="/feed"
                className="group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-border bg-card/80 py-2 pl-4.5 pr-2 text-[10px] font-bold text-foreground shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:gap-3 sm:py-2.5 sm:pl-6 sm:pr-2.5 sm:text-xs lg:py-3 lg:pl-8 lg:pr-3 lg:text-sm"
              >
                Explore Stories
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent group-hover:text-white sm:h-7 sm:w-7 lg:h-9 lg:w-9">
                  <Icons.arrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                </span>
              </Link>
            </motion.div>

            {/* Feature Row */}
            <motion.div
              custom={0.52}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-6 hidden max-w-[500px] grid-cols-3 divide-x divide-border sm:grid lg:mt-10"
            >
              <HeroFeature
                icon={<Icons.book className="h-4 w-4" />}
                title="Preserve"
                text="Your memories"
              />
              <HeroFeature
                icon={<Icons.image className="h-4 w-4" />}
                title="Remember"
                text="Every moment"
              />
              <HeroFeature
                icon={<Icons.heartRegular className="h-4 w-4" />}
                title="Inspire"
                text="Future generations"
              />
            </motion.div>
          </div>

          {/* Right Hero Visual */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 35 }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex min-w-0 items-center justify-center"
          >
            <div
              aria-hidden="true"
              className="absolute right-[2%] top-[8%] aspect-square w-[85%] rounded-full bg-accent/8 blur-2xl sm:w-[90%] lg:right-[-5%] lg:top-[4%] lg:w-[95%] xl:w-[100%]"
            />

            <div
              aria-hidden="true"
              className="absolute left-[8%] top-[8%] text-accent/50"
            >
              <Icons.sparkles className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7" />
            </div>

            <div
              aria-hidden="true"
              className="absolute right-[8%] top-[18%] text-accent/40"
            >
              <Icons.sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6" />
            </div>

            {/* Main Hero Illustration */}
            <div className="relative z-10 w-[105%] sm:w-[108%] lg:w-[112%] xl:w-[115%]">
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

function HeroFeature({ icon, title, text }) {
  return (
    <div className="flex items-center gap-2 px-3 first:pl-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-primary">{title}</p>
        <p className="text-[10px] text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export default Hero;
