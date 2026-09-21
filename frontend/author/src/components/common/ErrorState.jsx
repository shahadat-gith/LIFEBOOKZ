import { Icons } from "../../icons";

/**
 * "This didn't load" — one component for every failed fetch, with the API's
 * own message when there is one and a retry when the caller can offer one.
 *
 * Nothing here is page-specific on purpose: a failed story, a failed
 * dashboard and a failed feed should all look and read the same.
 */
export default function ErrorState({
  icon: Icon = Icons.exclamationCircle,
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-16 text-center ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-7 w-7 text-destructive" />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>

      {message && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground">{message}</p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Icons.refresh className="h-4 w-4" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
