import { motion } from "framer-motion";
import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";
import { PrimaryButton } from "./wizardShared";

const CHAPTER_TITLES = [
  "Childhood",
  "School Days",
  "School Life",
  "College Life",
  "Career",
  "Marriage",
  "Family",
];

export default function SelectChapterStep({
  chapters,
  onSelect,
  onCreateNew,
  onBack,
}) {
  return (
    <WizardShell step={1} totalSteps={10} title="My Lifebook" onBack={onBack}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Select Chapter
      </p>

      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Which chapter is this story part of?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose an existing chapter
          <br />
          or create a new one.
        </p>
      </div>

      <div className="space-y-3">
        {chapters.map((ch, idx) => {
          const count = ch.stories?.length || 0;
          const cover = ch.coverImage?.url || ch.media?.find((m) => m.type === "image")?.url;
          return (
            <motion.button
              key={ch.id || idx}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(idx)}
              className="w-full flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
            >
              {/* Number + cover thumb */}
              <div className="relative flex-shrink-0">
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Icons.book className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <span className="absolute -bottom-1 -left-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {ch.title || `Chapter ${idx + 1}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count} {count === 1 ? "Story" : "Stories"}
                </p>
              </div>

              <Icons.chevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          );
        })}

        {/* Create New Chapter */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.99 }}
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
        >
          <Icons.plus className="h-4 w-4" />
          Create New Chapter
        </motion.button>

        {chapters.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Suggested chapters: {CHAPTER_TITLES.slice(0, 4).join(", ")}…
          </p>
        )}
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={onCreateNew}>Continue</PrimaryButton>
      </div>
    </WizardShell>
  );
}
