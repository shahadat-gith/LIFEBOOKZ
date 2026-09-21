import { Icons } from "../../icons";
import { apiErrorMessage } from "../../utils/helpers";

/**
 * "We couldn't load this" strip with a retry action.
 *
 * Every data-backed section on the portal reports a failed load the same way,
 * so the markup lives here instead of being copied per section.
 */
export default function ErrorBanner({
  error,
  message,
  onRetry,
  className = "",
}) {
  const text =
    message ||
    apiErrorMessage(error, "We couldn't load this right now. Please try again.");

  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 ${className}`}
    >
      <Icons.exclamationCircle className="h-4 w-4 shrink-0 text-destructive" />
      <p className="mr-auto text-xs text-muted-foreground">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
