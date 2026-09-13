import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Icons } from "../../icons";
import UsersIcon from "./UsersIcon";

const HIGHLIGHTS = [
  {
    icon: UsersIcon,
    title: "Reach people who need you",
    text: "Get matched with readers and authors seeking guidance in your field.",
  },
  {
    icon: Icons.calendar,
    title: "Consultations on your terms",
    text: "Set your own availability, session price and areas of expertise.",
  },
  {
    icon: Icons.shieldCheck,
    title: "A verified expert profile",
    text: "Applications are reviewed, so clients book with full confidence.",
  },
];

/**
 * Split-panel auth layout for the expert portal:
 *  - Left (desktop): navy brand panel with wordmark, pitch and highlights
 *  - Right: centered form card area (children)
 *  - Top: slim brand bar for mobile
 */
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* ═══════════ Brand panel (desktop only) ═══════════ */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[44%] relative overflow-hidden bg-primary text-primary-foreground flex-col justify-between p-10 xl:p-14">
        {/* Decorative gradients */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gray-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        {/* Wordmark */}
        <Link to="/login" className="relative">
          <span className="font-display text-2xl font-bold tracking-tight">
            LIFEBOOK<span className="text-accent">Z</span>
          </span>
          <span className="block text-xs text-primary-foreground/60 mt-1">
            Expert Portal
          </span>
        </Link>

        {/* Headline + highlights */}
        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl xl:text-4xl font-bold leading-tight"
          >
            Turn your expertise
            <br />
            into impact.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-sm text-primary-foreground/70 leading-relaxed max-w-md"
          >
            Join LifeBookz as a verified expert — offer consultations, guide
            storytellers, and grow your practice on your own schedule.
          </motion.p>

          <div className="mt-10 space-y-6">
            {HIGHLIGHTS.map((h, i) => {
              const Icon = h.icon;
              return (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-accent-foreground" />
                  </span>
                  <div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-sm text-primary-foreground/60 mt-0.5 max-w-sm leading-relaxed">
                      {h.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative text-sm italic text-primary-foreground/50"
        >
          “Guidance given well echoes through generations.”
        </motion.p>
      </aside>

      {/* ═══════════ Form panel ═══════════ */}
      <main className="flex-1 flex flex-col">
        {/* Slim brand bar (mobile only — brand panel covers desktop) */}
        <div className="lg:hidden flex justify-center pt-8">
          <Link to="/login" className="text-center">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              LIFEBOOK<span className="text-accent">Z</span>
            </span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">
              Expert Portal
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-md"
          >
            <div className="rounded-3xl border border-border/60 bg-card shadow-md p-7 sm:p-9">
              {children}
            </div>
          </motion.div>
        </div>

        <p className="pb-6 text-center text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} Lifebookz — Expert Portal.
        </p>
      </main>
    </div>
  );
}
