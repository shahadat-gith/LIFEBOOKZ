import { useState } from "react";
import { motion } from "framer-motion";
import { Icons } from "../../icons";

const STEPS_GUIDE = [
  { label: "Select Chapter", hint: "Where does this story belong?", icon: Icons.book },
  { label: "Choose Story Type", hint: "Experience, memory, lesson…", icon: Icons.tag },
  { label: "Story Details", hint: "Title, when and where", icon: Icons.edit },
  { label: "Write Your Story", hint: "The heart of it, in your words", icon: Icons.document },
  { label: "Add Media", hint: "Photos, video or audio", icon: Icons.camera },
  { label: "Choose Visibility", hint: "Who can read it", icon: Icons.shieldCheck },
  { label: "Preview & Publish", hint: "See it live before you share", icon: Icons.globe },
  { label: "Story Published", hint: "Shared with your readers", icon: Icons.verified },
];

/** Expandable "how to write your story" guide. */
export default function WritingGuide({ onStart }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 p-5 sm:p-6 text-left hover:shadow-sm transition-shadow"
      >
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Icons.edit className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              How to write your story
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              8 guided steps — from a blank page to a published story.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:brightness-110 transition-all">
            <Icons.plus className="h-3.5 w-3.5" />
            Write Now
          </span>
          <Icons.chevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          {STEPS_GUIDE.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-xs"
              >
                <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary/5 border border-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    <span className="text-accent mr-1.5">{idx + 1}.</span>
                    {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.hint}</p>
                </div>
              </div>
            );
          })}

         
        </motion.div>
      )}
    </div>
  );
}
