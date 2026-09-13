import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Icons } from "../../icons";

function ProgressRing({ percent }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-primary/10" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-accent transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-foreground">{percent}%</span>
      </div>
    </div>
  );
}

/** Lifebook progress card with animated completion ring + write CTA. */
export default function LifebookProgressCard({ stats }) {
  const hasContent = stats.chapters > 0 || stats.stories > 0;
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8"
    >
      <span className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex-shrink-0 shadow-sm">
        <Icons.book className="h-6 w-6" />
      </span>

      <div className="flex-1 min-w-0">
        <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
          {hasContent ? "Your Lifebook is growing" : "Your Lifebook is waiting"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasContent
            ? `${stats.stories} ${stats.stories === 1 ? "story" : "stories"} across ${stats.chapters} ${stats.chapters === 1 ? "chapter" : "chapters"} so far.`
            : "You haven't written your story yet. Let's start with your first chapter."}
        </p>
       
      </div>

      <div className="flex flex-col items-center gap-1 self-center sm:self-auto">
        <ProgressRing percent={stats.percent} />
        <span className="text-xs text-muted-foreground">Story Progress</span>
      </div>
    </motion.div>
  );
}
