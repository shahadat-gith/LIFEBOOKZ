import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import TestimonialForm from "../components/home/TestimonialForm";
import TestimonialsSection from "../components/home/TestimonialsSection";
import { Icons } from "../icons";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const features = [
  {
    icon: <Icons.edit className="h-5 w-5" />,
    title: "Rich Story Editor",
    desc: "A distraction-free writing environment built for long-form narrative structure and seamless formatting.",
  },
  {
    icon: <Icons.sparkles className="h-5 w-5" />,
    title: "Editorial Review",
    desc: "Receive structured feedback and quality benchmarks from our curatorial team before going live.",
  },
  {
    icon: <Icons.book className="h-5 w-5" />,
    title: "Global Audience",
    desc: "Publish directly to readers worldwide and build a loyal audience across web and mobile platforms.",
  },
  {
    icon: <Icons.shieldCheck className="h-5 w-5" />,
    title: "Author Identity",
    desc: "Showcase your portfolio, bio, awards, and social profiles with an elegant custom author page.",
  },
];

const stats = [
  { value: "500+", label: "Active Authors" },
  { value: "10K+", label: "Published Stories" },
  { value: "50K+", label: "Monthly Readers" },
  { value: "95%", label: "Satisfaction Rate" },
];

const steps = [
  {
    step: "01",
    title: "Apply & Onboard",
    desc: "Register your author account, submit your background details, and set up your publishing profile.",
  },
  {
    step: "02",
    title: "Draft Your Narrative",
    desc: "Utilize our clean editorial workspace to write, structure, and refine your work at your own pace.",
  },
  {
    step: "03",
    title: "Submit for Review",
    desc: "Send your draft to our editorial board for quick quality assurance and constructive feedback.",
  },
  {
    step: "04",
    title: "Publish Globally",
    desc: "Once approved, your piece is distributed to thousands of active readers across the platform.",
  },
];

export default function AuthorHomePage() {
  const { isAuthenticated } = useAuth();
  const [testimonialsRefresh, setTestimonialsRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
      {/* ─── Hero Section ─── */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 px-6 border-b border-border/60">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full" />
        </div>

        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {/* Subtle Tagline Badge */}
          <motion.div variants={fadeUp} className="inline-block mb-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card text-xs font-medium tracking-wide uppercase text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Official Author Portal
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-[1.08]"
          >
            Craft Stories That Endure. <br />
            <span className="text-secondary font-normal italic">
              Reach Readers Worldwide.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-sans"
          >
            Join a curated collective of writers. Access an unencumbered
            editorial suite, receive expert editorial review, and share your
            work with an engaged global audience.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuthenticated ? (
              <Link to="/stories/new">
                <Button
                  size="xl"
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all rounded-lg"
                  icon={<Icons.documentAdd className="h-4 w-4" />}
                >
                  Create New Story
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button
                  size="xl"
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all rounded-lg"
                  icon={<Icons.userAdd className="h-4 w-4" />}
                >
                  Apply as an Author
                </Button>
              </Link>
            )}
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-secondary hover:text-foreground transition-colors"
            >
              Explore Workflow &rarr;
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats Banner ─── */}
      <section className="py-16 px-6 border-b border-border/40 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y sm:divide-y-0 divide-border/40">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="text-center pt-6 sm:pt-0"
              >
                <p className="font-display text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Key Features ─── */}
      <section className="py-24 px-6 bg-muted/20 border-b border-border/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-4">
              Designed for Literary Precision
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Every tool and workflow is designed to minimize distraction and
              amplify your creative focus.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group p-8 rounded-xl bg-card border border-border/60 hover:border-border transition-all duration-300 shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary mb-6 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {f.icon}
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 px-6 border-b border-border/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-4">
              The Publishing Lifecycle
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              A transparent four-step pipeline from initial application to global release.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-6 p-6 rounded-xl border border-border/60 bg-card/60 shadow-xs"
              >
                <span className="font-display text-xl font-medium text-accent tracking-widest">
                  {s.step}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials: share + display ─── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <TestimonialForm
            onSubmitted={() => setTestimonialsRefresh((k) => k + 1)}
          />
        </div>
      </section>

      <TestimonialsSection refreshKey={testimonialsRefresh} />

      {/* ─── Editorial Footer ─── */}
      <footer className="border-t border-border py-10 px-6 bg-background text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Icons.book className="h-4 w-4 text-foreground" />
            <span className="font-medium text-foreground tracking-tight">LifeBookz</span>
            <span className="text-border">|</span>
            <span>Author Portal</span>
          </div>
          <p>&copy; {new Date().getFullYear()} LifeBookz Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}