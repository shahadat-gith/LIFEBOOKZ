import { motion } from "framer-motion";
import { Icons } from "../../icons";

/**
 * Mockup-style wizard chrome:
 *  - Coral step-count badge (top-left)
 *  - Header row: back chevron + centered title
 *  - Centered card body on soft navy-tinted background
 */
export function WizardShell({
  step,
  totalSteps,
  title,
  onBack,
  children,
  maxWidth = "max-w-md",
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 px-4">
      {/* Coral step badge */}
      <div className="mx-auto max-w-5xl">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold shadow-sm">
          {step}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`mx-auto mt-3 w-full ${maxWidth}`}
      >
        {/* Header row: back chevron + centered title */}
        <div className="relative flex items-center justify-center mb-5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="absolute left-0 flex items-center justify-center w-9 h-9 rounded-full text-foreground hover:bg-muted transition-colors"
            >
              <Icons.chevronLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="font-display text-base font-semibold text-foreground">
            {title}
          </h1>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

export default WizardShell;
