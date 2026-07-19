import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Icons } from "../../icons";

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
    activeReaders: "15k+",
  });

  const [featuredStory, setFeaturedStory] = useState({
    title: "The memories that made me who I am.",
    description: "Every chapter of life carries deep lessons, hidden struggles, and profound joy. Preserve those moments safely so your loved ones can revisit them forever.",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "Sarah Johnson",
      avatarUrl: "https://i.pravatar.cc/100?img=15",
      role: "Story Author",
    },
    metrics: {
      likes: 248,
      comments: 37,
    },
  });

  useEffect(() => {
    async function fetchHeroData() {
      try {
        // replace with actual API calls later
      } catch (error) {
        console.error("Failed to fetch landing parameters:", error);
      }
    }
    fetchHeroData();
  }, []);

  return (
    <section className="relative overflow-hidden bg-background select-none flex items-center">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid min-h-[82vh] items-center gap-12 lg:gap-20 lg:grid-cols-2 sm:py-12 lg:py-0">
          
          {/* Left Content Column */}
          <div className="max-w-2xl text-center lg:text-left flex flex-col items-center lg:items-start">
            <motion.h1
              custom={0.15}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight text-foreground xs:text-4xl sm:text-6xl lg:text-7xl font-display leading-[1.15] lg:leading-[1.1]"
            >
              Every life has a{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
                story worth preserving.
              </span>
            </motion.h1>

            <motion.p
              custom={0.3}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-muted-foreground/90 font-sans"
            >
              Capture your memories, life experiences, family history, and achievements in one elegant place. Create a digital legacy that inspires your children, grandchildren, and generations to come.
            </motion.p>

            {/* Dynamic Editorial Style Metrics Grid */}
            <motion.div
              custom={0.6}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mt-8 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-xl border-t border-border/60 pt-6 sm:pt-8"
            >
              <div className="text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-display">
                  {stats.storiesShared}
                </h3>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground/80">Stories Shared</p>
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-display">
                  {stats.authors}
                </h3>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground/80">Authors</p>
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-display">
                  {stats.activeReaders}
                </h3>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground/80">Active Readers</p>
              </div>
            </motion.div>
          </div>

          {/* Showcase Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center w-full px-2 sm:px-0"
          >
            {/* Ambient Backlighting */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] rounded-full bg-accent/5 blur-3xl" />
            </div>

            {/* Dynamic Premium Showcase Card */}
            <motion.div
              whileHover={{ y: -6, rotate: -0.5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg"
            >
              <img
                src={featuredStory.imageUrl}
                alt={featuredStory.title}
                className="h-48 sm:h-60 w-full object-cover select-none pointer-events-none"
              />

              <div className="p-5 sm:p-6">
                <div className="mb-2.5 sm:mb-3 flex items-center">
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Featured Story
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-foreground font-display leading-snug">
                  {featuredStory.title}
                </h2>

                <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground/90">
                  {featuredStory.description}
                </p>

                <div className="mt-4 sm:mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={featuredStory.author.avatarUrl}
                      alt={featuredStory.author.name}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-border/40"
                    />
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-foreground">{featuredStory.author.name}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground/80">{featuredStory.author.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground/70">
                    <div className="flex items-center gap-1">
                      <Icons.heartRegular className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs font-medium">{featuredStory.metrics.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icons.chat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs font-medium">{featuredStory.metrics.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
