import { Icons } from "../../../icons";
import { WizardShell } from "./WizardShell";
import { PrimaryButton } from "./WizardShell";

export default function StoryDetailsStep({
  story,
  onChange,
  onContinue,
  onBack,
}) {
  const canContinue = story.title?.trim().length > 0;

  return (
    <WizardShell step={3} totalSteps={9} title="Story Details" onBack={onBack}>
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Name your story
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A title helps readers know what this memory is about.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Story Title *
          </label>
          <input
            type="text"
            value={story.title || ""}
            onChange={(e) => onChange({ ...story, title: e.target.value })}
            placeholder="Give your story a title"
            maxLength={200}
            autoFocus
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
              <Icons.clock className="h-4 w-4 text-muted-foreground" />
              When (Optional)
            </label>
            <input
              type="text"
              value={story.dateLabel || ""}
              onChange={(e) => onChange({ ...story, dateLabel: e.target.value })}
              placeholder="When did this happen?"
              maxLength={100}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
              <Icons.globe className="h-4 w-4 text-muted-foreground" />
              Where (Optional)
            </label>
            <input
              type="text"
              value={story.location || ""}
              onChange={(e) => onChange({ ...story, location: e.target.value })}
              placeholder="Where did this happen?"
              maxLength={150}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onContinue} disabled={!canContinue}>
          Continue
        </PrimaryButton>
      </div>
    </WizardShell>
  );
}
