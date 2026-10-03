import { motion } from "framer-motion";
import { Icons } from "../../icons";
import UsersIcon from "../../icons/UsersIcon";

const HIGHLIGHTS = [
  {
    icon: UsersIcon,
    title: "Reach people who need you",
    text: "Get matched with readers and authors seeking guidance in your field.",
  },
  {
    icon: Icons.calendar,
    title: "Consultations on your terms",
    text: "Set your own session price and areas of expertise.",
  },
  {
    icon: Icons.shieldCheck,
    title: "A verified expert profile",
    text: "Applications are reviewed, so clients book with full confidence.",
  },
];

/**
 * Split-panel auth layout: navy brand panel with the two-tone wordmark,
 * pitch and highlights on the left; the form card on the right.
 */
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-background flex">


      {/* ═══════════ Form panel ═══════════ */}
      <main className="flex-1 flex flex-col">


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
          © {new Date().getFullYear()} LifeBookz.
        </p>
      </main>
    </div>
  );
}
