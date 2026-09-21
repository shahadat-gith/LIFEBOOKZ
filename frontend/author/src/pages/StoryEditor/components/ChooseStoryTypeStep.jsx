import { motion } from "framer-motion";
import { STORY_TYPES } from "../../../utils/storyTypes";
import { WizardShell } from "./WizardShell";
import { PrimaryButton } from "./WizardShell";

/** Step 2 — the kind of story being written, from the shared type list. */
export default function ChooseStoryTypeStep({
  storyType,
  onPick,
  onContinue,
  onBack,
}) {
  return (
    <WizardShell step={2} totalSteps={9} title="Choose Story Type" onBack={onBack}>
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground leading-snug">
          What type of story
          <br />
          would you like to share?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You can change this later.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {STORY_TYPES.map((t) => {
          const Icon = t.icon;
          const selected = storyType === t.value;
          return (
            <motion.button
              key={t.value}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onPick(t.value)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
                selected
                  ? "border-accent bg-accent/5 shadow-sm ring-1 ring-accent/30"
                  : "border-border/70 bg-card shadow-xs hover:border-border"
              }`}
            >
              <Icon className={`h-6 w-6 ${t.color}`} />
              <span className="text-xs font-semibold text-foreground">{t.label}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">{t.hint}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
      </div>
    </WizardShell>
  );
}
