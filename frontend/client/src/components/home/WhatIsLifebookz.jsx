import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import Icons from "../../icons";

const AUTHORS = [
  {
    title: "Write your life, your way",
    description:
      "Capture your memories chapter by chapter — in your own words and language, at your own pace.",
  },
  {
    title: "Publish to the world",
    description:
      "Share your finished lifebook with family, friends, or readers everywhere.",
  },
  {
    title: "Leave a legacy",
    description:
      "Your story stays preserved, so the people you love can return to it for generations.",
  },
];

const READERS = [
  {
    title: "Discover real lives",
    description:
      "Wander through stories from every walk of life — the ordinary and the extraordinary.",
  },
  {
    title: "Learn from lived lessons",
    description:
      "Find comfort and guidance in how others faced their hardest days and biggest turns.",
  },
  {
    title: "Get inspired, any day",
    description:
      "Trending and featured lifebooks bring fresh perspectives to your feed, whenever you need them.",
  },
];

function AudiencePanel({
  icon: Icon,
  label,
  subtitle,
  items,
  cta,
  ctaHref,
  external,
  delay,
  isInView,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      className="flex flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-border/70 bg-card/70 shadow-xs"
    >
      {/* Panel header */}
      <div className="flex items-center gap-3.5 border-b border-border/70 px-6 py-5 sm:px-7">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/15 via-accent/10 to-accent/[0.04] text-accent ring-1 ring-inset ring-accent/15">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-extrabold tracking-tight text-foreground">
            {label}
          </h3>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-1 flex-col">
        {items.map((item, index) => (
          <div
            key={item.title}
            className={`group/item flex gap-4 px-6 py-5 transition-colors duration-200 hover:bg-accent/[0.03] sm:px-7 ${
              index > 0 ? "border-t border-border/70" : ""
            }`}
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/[0.06] font-display text-[10px] font-extrabold text-accent transition-colors duration-200 group-hover/item:bg-accent group-hover/item:text-white">
              {index + 1}
            </span>
            <div>
              <h4 className="font-display text-[15px] font-bold leading-snug tracking-tight text-foreground sm:text-base">
                {item.title}
              </h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Audience CTA */}
      <div className="border-t border-border/70 px-6 py-4 sm:px-7">
        {external ? (
          <a
            href={ctaHref}
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-accent"
          >
            {cta}
            <Icons.arrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        ) : (
          <Link
            to={ctaHref}
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-accent"
          >
            {cta}
            <Icons.arrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export function WhatIsLifebookz() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const authorPortalUrl =
    import.meta.env.VITE_AUTHOR_PORTAL || "https://author.lifebookz.com";

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-border/60 bg-background py-14 select-none sm:py-24"
    >
      {/* Soft wash behind the whole section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-accent/[0.05] via-accent/[0.015] to-transparent"
      />

      {/* Floating glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-blue-500/[0.05] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-accent/[0.07] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          {/* Definition */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-28"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[0.08] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              <Icons.sparkles className="h-3 w-3" />
              The idea
            </span>

            <h2 className="mt-5 max-w-lg font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              What is{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Lifebookz
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 9"
                  className="absolute -bottom-1.5 left-0 w-full text-accent/70 sm:-bottom-2.5"
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
              ?
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              A digital home for life stories. Write your own memories and
              leave a legacy — or read the lives of others and learn from the
              lessons they lived.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/70 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Write yours · Read theirs
            </div>
          </motion.div>

          {/* Two audiences — authors & readers */}
          <div className="grid gap-6 xl:grid-cols-2">
            <AudiencePanel
              icon={Icons.edit}
              label="For Authors"
              subtitle="Write · Preserve · Pass on"
              items={AUTHORS}
              cta="Start your Lifebook"
              ctaHref={authorPortalUrl}
              external
              delay={0.08}
              isInView={isInView}
            />
            <AudiencePanel
              icon={Icons.book}
              label="For Readers"
              subtitle="Discover · Learn · Be inspired"
              items={READERS}
              cta="Explore life stories"
              ctaHref="/feed"
              external={false}
              delay={0.16}
              isInView={isInView}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhatIsLifebookz;
