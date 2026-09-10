import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import Icons from "../../icons";

const FEATURES = [
  {
    icon: Icons.academic,
    iconClassName: "text-blue-700 ring-blue-200/80 dark:text-blue-300 dark:ring-blue-400/30",
    title: "Expert guidance",
    desc: "Coaches across education, career, relationships and more.",
  },
  {
    icon: Icons.heartSolid,
    iconClassName: "text-accent ring-accent/25",
    title: "One-on-one sessions",
    desc: "Book private sessions at times that work for you.",
  },
  {
    icon: Icons.shieldCheck,
    iconClassName: "text-emerald-700 ring-emerald-200/80 dark:text-emerald-300 dark:ring-emerald-400/30",
    title: "Confidential & safe",
    desc: "Talk freely in a private, judgment-free space.",
  },
];

export function ConsultationSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-border/60 bg-background py-14 select-none sm:py-24"
    >
      {/* Soft wash behind the whole section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-accent/[0.05] via-accent/[0.015] to-transparent"
      />

      {/* Floating glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-pink-500/[0.06] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-blue-500/[0.06] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/70 bg-card/70 shadow-xs">
          {/* decorative tints */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-pink-500/[0.08] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-blue-500/[0.08] blur-3xl"
          />

          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:p-14">
            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
             

              <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Talk to a{" "}
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  coach
                </span>
                .
              </h2>

              <p className="mt-3 max-w-md text-[15px] leading-7 text-muted-foreground">
                Get guidance, clarity and support for what truly matters to you
                — from education and career to relationships and personal
                growth.
              </p>

              <ul className="mt-7 grid gap-4 sm:grid-cols-1">
                {FEATURES.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card/85 shadow-sm ring-1 ring-inset dark:bg-card/70 ${item.iconClassName}`}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[15px] font-bold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  to="/consult"
                  className="group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-colors group-hover:bg-white/25">
                    <Icons.chat className="h-3.5 w-3.5 text-white" />
                  </span>
                  Talk to a Coach
                </Link>

              
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              aria-hidden="true"
              className="relative mx-auto flex h-64 w-full max-w-[360px] select-none items-center justify-center sm:h-72"
            >
              {/* Ambient glow */}
              <div className="absolute h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

              {/* Conversation bubble card */}
              <div className="relative z-10 w-full max-w-[300px] rotate-[-2deg] rounded-2xl border border-border/60 bg-white p-5 shadow-xl shadow-primary/10 transition-transform duration-500 hover:rotate-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-blue-700 shadow-sm ring-1 ring-blue-200/80 dark:bg-card/70 dark:text-blue-300 dark:ring-blue-400/30">
                    <Icons.academic className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Dr. Sarah Mitchell
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Academic & Study Coach
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-xs leading-5 text-primary-foreground">
                    How do I pick the right course for me?
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-xs leading-5 text-foreground/80">
                    Great question — let's start with what you enjoy doing...
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end border-t border-border/60 pt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                    <Icons.starSolid className="h-3 w-3" />
                    4.9 · 128 sessions
                  </span>
                 
                </div>
              </div>

              <Icons.sparkles className="absolute -top-1 right-2 h-5 w-5 text-amber-400/80" />
              <Icons.heartSolid className="absolute -bottom-2 left-2 h-5 w-5 text-pink-400/70" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ConsultationSection;