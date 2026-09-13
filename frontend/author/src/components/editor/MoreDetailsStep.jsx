import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";
import { PrimaryButton, LinkButton } from "./wizardShared";

export default function MoreDetailsStep({
  story,
  chapter,
  onChangeStory,
  onChangeChapter,
  onContinue,
  onBack,
}) {
  return (
    <WizardShell step={6} totalSteps={10} title="Add More Details" onBack={onBack}>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Everything here is optional — add color to your story.
      </p>

      <div className="space-y-5">
        {/* Chapter note */}
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icons.book className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              Chapter: {chapter?.title || "Untitled chapter"}
            </p>
          </div>
          <textarea
            value={chapter?.description || ""}
            onChange={(e) => onChangeChapter({ ...chapter, description: e.target.value })}
            rows={2}
            maxLength={2000}
            placeholder="Write a short note about this chapter"
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all resize-y"
          />
        </div>

        {/* Lifebook summary */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Lifebook Summary (Optional)
          </label>
          <textarea
            value={story.summary || ""}
            onChange={(e) => onChangeStory({ ...story, summary: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder="Write a short description of your lifebook"
            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all resize-y"
          />
          <p className="text-[11px] text-muted-foreground mt-1 text-right">
            {(story.summary || "").length}/500
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
        <div className="text-center">
          <LinkButton onClick={onContinue}>Skip for Now</LinkButton>
        </div>
      </div>
    </WizardShell>
  );
}
