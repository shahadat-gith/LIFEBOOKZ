import { motion } from "framer-motion";

/** Flow steps shown on the cover screen (matches the mockup overview). */
export const FLOW_STEPS = [
  "Select Chapter",
  "Choose Story Type",
  "Story Details",
  "Write Your Story",
  "Add Media",
  "Add More Details",
  "Choose Visibility",
  "Preview Story",
  "Publish Story",
  "Story Published",
];

/** Primary navy pill button used across the wizard. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3.5 font-display text-sm font-semibold shadow-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/** Underlined tertiary link button (e.g. "Skip for Now"). */
export function LinkButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

/** Flow overview screen shown when opening the wizard fresh. */
export function FlowOverview({ onStart, onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-[calc(100vh-4rem)] py-10 px-4"
    >
      <div className="mx-auto w-full max-w-md">
        <div className="relative flex items-center justify-center mb-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="absolute left-0 flex items-center justify-center w-9 h-9 rounded-full text-foreground hover:bg-muted transition-colors"
            >
              <span className="text-xl leading-none">←</span>
            </button>
          )}
          <span className="font-display text-2xl font-bold tracking-tight">
            LIFEBOOK<span className="text-accent">Z</span>
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground">
          Story Writing Flow
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          From creating a story to publishing it in your chapter.
        </p>

        <ol className="mt-8 space-y-4">
          {FLOW_STEPS.map((label, idx) => (
            <li key={label} className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <PrimaryButton onClick={onStart}>Start Writing</PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}
