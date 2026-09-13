import { motion } from "framer-motion";
import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";
import { PrimaryButton } from "./wizardShared";

function ShareIcon() {
  return <Icons.share className="h-4 w-4" />;
}

export default function PublishedStep({
  storyUrl,
  onAddAnother,
  onGoLifebook,
  onBack,
}) {
  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "My Lifebook Story", url: storyUrl || window.location.href });
    } else if (storyUrl) {
      navigator.clipboard.writeText(storyUrl);
    }
  }

  const NEXT_ACTIONS = [
    { label: "Share your story", icon: <ShareIcon />, onClick: handleShare },
    { label: "Add another story", icon: <Icons.plus className="h-4 w-4" />, onClick: onAddAnother },
    { label: "Go to my Lifebook", icon: <Icons.book className="h-4 w-4" />, onClick: onGoLifebook },
  ];

  return (
    <WizardShell step={10} totalSteps={10} title="Story Published" onBack={onBack}>
      {/* Success burst */}
      <div className="flex flex-col items-center py-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative"
        >
          <span className="flex items-center justify-center w-24 h-24 rounded-full bg-success/85 shadow-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-12 h-12 text-white"
              stroke="currentColor"
              strokeWidth={3}
            >
              <motion.path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              />
            </svg>
          </span>

          {/* Confetti sparks */}
          {[
            "top-0 left-0 text-accent",
            "top-2 right-0 text-warning",
            "bottom-0 right-2 text-info",
            "bottom-1 left-1 text-accent",
          ].map((pos, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.6], scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className={`absolute ${pos}`}
            >
              <Icons.sparkles className="h-3.5 w-3.5" />
            </motion.span>
          ))}
        </motion.div>

        <h2 className="mt-6 font-display text-2xl font-bold text-foreground">
          Your story is live!
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground text-center">
          Your story has been published
          <br />
          successfully.
        </p>
      </div>

      {/* What's next */}
      <p className="text-sm font-bold text-foreground mb-2">What's next?</p>
      <div className="rounded-2xl border border-border/70 bg-card shadow-xs divide-y divide-border/50 overflow-hidden">
        {NEXT_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="text-muted-foreground">{a.icon}</span>
            <span className="flex-1 text-sm font-medium text-foreground">
              {a.label}
            </span>
            <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onGoLifebook}>View My Lifebook</PrimaryButton>
      </div>
    </WizardShell>
  );
}
