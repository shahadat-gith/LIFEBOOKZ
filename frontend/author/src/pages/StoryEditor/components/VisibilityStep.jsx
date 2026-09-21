import { Icons } from "../../../icons";
import { VISIBILITY_OPTIONS } from "../../../utils/visibility";
import { WizardShell } from "./WizardShell";
import { PrimaryButton } from "./WizardShell";

/** Step 6 — who can read this story, from the shared visibility options. */
export default function VisibilityStep({
  visibility,
  onChange,
  onContinue,
  onBack,
}) {
  return (
    <WizardShell step={6} totalSteps={9} title="Choose Visibility" onBack={onBack}>
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Who can see this story?
        </h2>
      </div>

      <div className="space-y-3">
        {VISIBILITY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = visibility === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                selected
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                  : "border-border/70 bg-card hover:border-border shadow-xs"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="mt-1 accent-[#172554]"
              />
              <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {opt.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Reassurance note */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-accent/5 border border-accent/20 p-4">
        <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
          <Icons.shieldCheck className="h-4 w-4 text-accent" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            You can change this later
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You'll always have full control over your story.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
      </div>
    </WizardShell>
  );
}
