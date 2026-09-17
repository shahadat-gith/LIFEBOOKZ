import { motion } from "framer-motion";
import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";

/**
 * The 7 fixed chapters of a life, matching the "Life Story Structure":
 * Childhood → School Life → College Life → Relationship → Career →
 * Marriage → Family. All seven are ALWAYS shown — chapters that don't
 * exist in the lifebook yet are created on the fly when picked, and the
 * author can still add a fully custom chapter.
 */
export const FIXED_CHAPTERS = [
  { title: "Childhood", hint: "Early memories, family, first adventures" },
  { title: "School Life", hint: "School days, teachers, friends" },
  { title: "College Life", hint: "Campus, achievements, friendships" },
  { title: "Relationship / Love Life", hint: "First love, memorable moments" },
  { title: "Career", hint: "Jobs, milestones, lessons at work" },
  { title: "Marriage", hint: "Partner, wedding, life together" },
  { title: "Family", hint: "Parents, siblings, children, traditions" },
];

function normTitle(t) {
  return String(t || "").trim().toLowerCase();
}

/**
 * Resolves what the author picked into a "chapter plan":
 *  - { kind: "existing", chapter }      → a chapter already in the lifebook
 *  - { kind: "fixed", fixed }           → one of the 7, to create if missing
 *  - { kind: "custom" }                 → brand-new custom chapter
 */
export function resolvePick(title, chapters) {
  const fixed = FIXED_CHAPTERS.find((f) => normTitle(f.title) === normTitle(title));
  const existing = chapters.find((ch) => normTitle(ch.title) === normTitle(title));
  if (existing) return { kind: "existing", chapter: existing };
  if (fixed) return { kind: "fixed", fixed };
  return { kind: "custom" };
}

export default function SelectChapterStep({
  chapters,
  onPick,
  onCreateNew,
  onBack,
}) {
  // All 7 fixed chapters (with their story counts if they exist), then any
  // custom chapters the author has created.
  const fixedRows = FIXED_CHAPTERS.map((f) => {
    const existing = chapters.find((ch) => normTitle(ch.title) === normTitle(f.title));
    return {
      fixed: f,
      existing,
      count: existing?.stories?.length || 0,
      cover:
        existing?.coverImage?.url ||
        existing?.media?.find((m) => m.type === "image")?.url,
    };
  });
  const customRows = chapters.filter(
    (ch) => !FIXED_CHAPTERS.some((f) => normTitle(f.title) === normTitle(ch.title)),
  );

  return (
    <WizardShell step={1} totalSteps={9} title="My Lifebook" onBack={onBack}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Select Chapter
      </p>

      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground leading-snug">
          Which chapter is this
          <br />
          story part of?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose an existing chapter
          <br />
          or create a new one.
        </p>
      </div>

      <div className="space-y-3">
        {/* The 7 fixed life chapters — always visible */}
        {fixedRows.map(({ fixed, existing, count, cover }) => (
          <motion.button
            key={fixed.title}
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => onPick(fixed.title)}
            className="w-full flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 text-left shadow-xs hover:border-primary/40 hover:bg-card hover:shadow-sm transition-all"
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center flex-shrink-0">
                <Icons.book className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">
                {fixed.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {existing
                  ? `${count} ${count === 1 ? "Story" : "Stories"}`
                  : "New chapter"}
              </p>
            </div>

            <Icons.chevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </motion.button>
        ))}

        {/* Custom chapters the author created */}
        {customRows.map((ch) => {
          const count = ch.stories?.length || 0;
          const cover =
            ch.coverImage?.url || ch.media?.find((m) => m.type === "image")?.url;
          return (
            <motion.button
              key={ch.id || ch._id || ch.title}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => onPick(ch.title)}
              className="w-full flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
            >
              {cover ? (
                <img
                  src={cover}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icons.tag className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {ch.title || "Untitled chapter"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count} {count === 1 ? "Story" : "Stories"}
                </p>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          );
        })}

        {/* Create New (custom) Chapter */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.99 }}
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
        >
          <Icons.plus className="h-4 w-4" />
          Create New Chapter
        </motion.button>
      </div>
    </WizardShell>
  );
}
