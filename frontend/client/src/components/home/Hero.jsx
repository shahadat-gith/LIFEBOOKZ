import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Icons from "../../icons";
import { fadeUp, SOCIAL_LINKS, STATS } from "./utils";
import { Link } from "react-router-dom";
import { share } from "../../utils/share";
import { toast } from "react-hot-toast";

export function Hero() {
  const [stats, setStats] = useState(STATS);
  const [socialLinks, setSocialLinks] = useState(SOCIAL_LINKS);
  const shouldReduceMotion = useReducedMotion();


  const authorPortalUrl = import.meta.env.VITE_AUTHOR_PORTAL || "https://author.lifebookz.com";


  const handleShareClick = async () => {
    const shareData = {
      title: "Lifebookz - Preserve Your Life's Journey",
      text: "Capture your memories, life experiences, family history, and achievements in one beautiful place.",
      url: window.location.href,
    };

    const shared = await share(shareData);
    if (!shared) {
      toast.error("Sharing failed or was cancelled.");
    }
  };



  useEffect(() => {
    async function fetchHeroData() {
      try {
        // Replace with API later
      } catch (error) {
        console.error(error);
      }
    }
    fetchHeroData();
  }, []);

  const initial = shouldReduceMotion ? "show" : "hidden";

  return (
    <section className="relative overflow-hidden bg-background">
      {/* faint archival grid, barely there */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[85vh] items-center gap-16 py-12 lg:grid-cols-2">
          {/* LEFT */}
          <div className="max-w-2xl">
            <motion.h1
              custom={0.15}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              Every life has a
              <span className="mt-2 block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                story worth preserving.
              </span>
            </motion.h1>

            <motion.p
              custom={0.3}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground"
            >
              Capture your memories, life experiences, family history, and
              achievements in one beautiful place. Build a timeless digital
              legacy that your children and future generations can revisit
              forever.
            </motion.p>

            <motion.div
              custom={0.45}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link to={authorPortalUrl} className="rounded-[var(--radius-full)] bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5">
                Write your story
              </Link>
              <Link to="/how-it-works" className="rounded-[var(--radius-full)] border border-border bg-transparent px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                See how it works
              </Link>
            </motion.div>

            <motion.div
              custom={0.6}
              initial={initial}
              animate="show"
              variants={fadeUp}
              className="mt-14 space-y-8 border-t border-border pt-8"
            >
              {/* Ledger stats */}
              <div className="flex flex-wrap gap-10">
                {stats.map((stat, i) => (
                  <div key={stat.key} className="flex items-center gap-10">
                    <div>
                      <h3 className="font-display text-3xl font-bold tabular-nums text-foreground">
                        {stat.value}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                    {i < stats.length - 1 && (
                      <div className="hidden h-10 w-px bg-border sm:block" />
                    )}
                  </div>
                ))}
              </div>

              {/* Social + share */}
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Follow us
                  </span>
                  <div className="flex items-center gap-2">
                    {socialLinks.map((social) => {
                      const IconComponent = social.icon;
                      return (
                        <a
                          key={social.name}
                          href={social.href}
                          aria-label={social.ariaLabel}
                          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                        >
                          <IconComponent className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={handleShareClick}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Share with your friends
                  <Icons.share className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — mounted photograph */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center"
          >
            <div className="absolute -right-10 top-10 h-80 w-80 rounded-[var(--radius-full)] bg-accent/10 blur-[120px]" />

            <div className="relative w-full max-w-[480px] -rotate-1 rounded-[var(--radius-2xl)] bg-card p-4 shadow-lg transition-transform duration-500 hover:rotate-0">
              <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
                <img
                  src="/hero.png"
                  alt="A family gathered together, one of many memories preserved on Lifebookz"
                  className="h-[560px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                {/* corner mounts */}
                {["top-2 left-2", "top-2 right-2 rotate-90", "bottom-2 left-2 -rotate-90", "bottom-2 right-2 rotate-180"].map(
                  (pos, i) => (
                    <span
                      key={i}
                      className={`absolute ${pos} h-6 w-6 border-l-2 border-t-2 border-accent/70`}
                    />
                  )
                )}

                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <h2 className="font-display text-2xl font-bold text-white">
                    Every memory deserves a home.
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
                    Preserve your life's journey today so your family can
                    relive every precious moment tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;