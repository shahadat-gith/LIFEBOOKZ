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
            {/* Welcome Badge */}
            <motion.div
              custom={0.05}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[7px] font-bold uppercase tracking-[0.12em] text-accent ring-1 ring-accent/20 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[9px] lg:px-4 lg:py-2 lg:text-[11px]"
            >
              Welcome to Lifebookz
              <Icons.sparkles className="h-2 w-2 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5" />
            </motion.div>

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
              Capture your memories, lessons and moments. Share what matters.
              Inspire others. Leave a legacy.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              custom={0.4}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-4 flex flex-col items-start gap-3 sm:mt-6 sm:flex-row sm:items-center sm:gap-6 lg:mt-8"
            >
              <a
                href={authorPortalUrl}
                className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-3.5 py-2 text-[9px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 sm:px-5 sm:py-2.5 sm:text-xs lg:px-7 lg:py-3.5 lg:text-sm"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/15 sm:h-5 sm:w-5 lg:h-6 lg:w-6">
                  <Icons.plus className="h-3 w-3 text-white" />
                </span>
                Start Your Lifebook
              </a>

              <Link
                to="/feed"
                className="group inline-flex items-center gap-1 text-[10px] font-bold text-primary underline decoration-primary/30 decoration-2 underline-offset-4 transition-colors hover:decoration-primary sm:text-xs lg:text-[15px]"
              >
                Explore Stories
                <Icons.arrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
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