import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Icons } from "../../icons";

const STEPS_GUIDE = [
  {
    label: "Select Chapter",
    hint: "Pick the chapter of your life this story belongs to — childhood, school, career…",
    icon: Icons.book,
  },
  {
    label: "Choose Story Type",
    hint: "Is it a memory, a life lesson, an achievement, or advice?",
    icon: Icons.tag,
  },
  {
    label: "Story Details",
    hint: "Give it a title and tell us when and where it happened.",
    icon: Icons.edit,
  },
  {
    label: "Write Your Story",
    hint: "The heart of it — write it the way you'd tell a friend.",
    icon: Icons.document,
  },
  {
    label: "Add Media",
    hint: "Attach photos, videos or audio to bring the story alive.",
    icon: Icons.camera,
  },
  {
    label: "Choose Visibility",
    hint: "Public, followers-only, or just you — chapter by chapter.",
    icon: Icons.shieldCheck,
  },
  {
    label: "Preview & Publish",
    hint: "See it exactly as readers will, then share it with the world.",
    icon: Icons.globe,
  },
];

/** Always-visible, numbered "how to write your story" guide. */
export default function WritingGuide() {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-10 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between p-5 sm:p-6 pb-4 sm:pb-4">
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Icons.edit className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              How to write your story
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              7 guided steps — from a blank page to a published story.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/stories/new")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-sm flex-shrink-0"
        >
          <Icons.plus className="h-4 w-4" />
          Write Now
        </button>
      </div>

      {/* Steps timeline */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ol className="relative">
          {STEPS_GUIDE.map((s, idx) => {
            const Icon = s.icon;
            const isLast = idx === STEPS_GUIDE.length - 1;
            return (
              <li key={s.label} className="relative flex gap-4 pb-5 last:pb-0">
                {/* Connector line */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[19px] top-10 bottom-0 w-px bg-blue-200/80"
                  />
                )}

                {/* Number badge */}
                <span className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-blue-200 shadow-sm">
                  <span className="font-display text-sm font-bold text-primary">
                    {idx + 1}
                  </span>
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0 rounded-2xl bg-white/80 border border-border/50 px-4 py-3 flex items-center gap-3.5 shadow-xs">
                  <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-primary/5 border border-primary/10">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.hint}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </motion.section>
  );
}
