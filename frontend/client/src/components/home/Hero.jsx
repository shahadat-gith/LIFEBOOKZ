import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icons from "../../icons";

// Refactored social media links array
const SOCIAL_LINKS = [
  { name: "Instagram", href: "#", icon: Icons.instagram, ariaLabel: "Instagram" },
  { name: "Facebook", href: "#", icon: Icons.facebook, ariaLabel: "Facebook" },
  { name: "X", href: "#", icon: Icons.twitter, ariaLabel: "X (formerly Twitter)" },
  { name: "YouTube", href: "#", icon: Icons.youtube, ariaLabel: "YouTube" },
  { name: "LinkedIn", href: "#", icon: Icons.linkedin, ariaLabel: "LinkedIn" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function Hero() {
  const [stats, setStats] = useState({
    storiesShared: "10K+",
    authors: "2K+",
    activeReaders: "15K+",
  });

  const [socialLiinks, setSocialLinks] = useState(SOCIAL_LINKS)

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

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[85vh] items-center gap-16 py-12 lg:grid-cols-2">
          {/* LEFT */}
          <div className="max-w-2xl">
           
            <motion.h1
              custom={0.15}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              Every life has a
              <span className="mt-2 block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                story worth preserving.
              </span>
            </motion.h1>

            <motion.p
              custom={0.3}
              initial="hidden"
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
              custom={0.6}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mt-14 space-y-8"
            >
              {/* Stats */}
              <div className="flex flex-wrap gap-10">
                <div>
                  <h3 className="text-4xl font-bold">{stats.storiesShared}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stories Shared
                  </p>
                </div>

                <div className="hidden h-12 w-px bg-border sm:block" />

                <div>
                  <h3 className="text-4xl font-bold">{stats.authors}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Authors</p>
                </div>

                <div className="hidden h-12 w-px bg-border sm:block" />

                <div>
                  <h3 className="text-4xl font-bold">{stats.activeReaders}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Active Readers
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap items-center gap-5 pt-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Follow us
                </span>

                {socialLiinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={social.ariaLabel}
                    >
                      <IconComponent className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex justify-center"
          >
            {/* Glow */}
            <div className="absolute -right-10 top-10 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />

            <div className="relative w-full max-w-[520px] overflow-hidden rounded-[32px] shadow-2xl">
              <img
                src="/hero.png"
                alt="Lifebookz"
                className="h-[620px] w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="font-display text-3xl font-bold text-white">
                  Every memory deserves a home.
                </h2>

                <p className="mt-3 max-w-sm text-base leading-7 text-white/80">
                  Preserve your life's journey today so your family can relive
                  every precious moment tomorrow.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;