import { motion } from "framer-motion";
import { Icons } from "../../icons";

/**
 * Professional wizard chrome:
 *  - Header: back chevron · centered step label + title
 *  - Animated progress bar with segment ticks
 *  - Content inside a floating rounded card
 *  - Optional footer slot so action buttons sit on a consistent baseline
 */
export function WizardShell({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
  footer,
  maxWidth = "max-w-xl",
}) {
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mx-auto w-full ${maxWidth}`}
      >
        {/* ── Header row ── */}
        <div className="flex items-center gap-3 mb-5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-border/70 bg-card text-foreground shadow-xs hover:bg-muted transition-colors"
            >
              <Icons.chevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="flex-shrink-0 w-10" />
          )}

          <div className="flex-1 min-w-0 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
              Step {step} of {totalSteps}
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight truncate">
              {title}
            </h1>
          </div>

          {/* Symmetric spacer keeps the title centered */}
          <span className="flex-shrink-0 w-10" />
        </div>

        {/* ── Progress bar ── */}
        <div className="mb-6">
          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </div>

        {/* ── Card body ── */}
        <div className="rounded-3xl border border-border/60 bg-card shadow-md p-5 sm:p-8">
          {subtitle && (
            <p className="text-center text-sm text-muted-foreground mb-6">
              {subtitle}
            </p>
          )}

          {children}

          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </motion.div>
    </div>
  );
}

export default WizardShell;

/** Primary navy pill button used across the wizard steps. */
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
