import { Icons } from "../../icons";

/**
 * "There is nothing here yet" — one component for every list that can come
 * back empty, so an empty feed, an empty chapter and an empty story list all
 * read the same way.
 *
 * `variant="plain"` sits in the page flow; `variant="panel"` draws the dashed
 * card used inside tabs and sections.
 */
export default function NoDataState({
  icon: Icon = Icons.document,
  title,
  description,
  action,
  variant = "plain",
  className = "",
}) {
  const ActionIcon = action?.icon;

  if (variant === "panel") {
    return (
      <div
        className={`rounded-2xl border border-dashed border-border bg-card p-10 text-center ${className}`}
      >
        {Icon && (
          <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        )}
        <p className="font-display font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-16 text-center ${className}`}
    >
      <div className="mb-4 text-muted-foreground/40">
        {Icon && <Icon className="h-12 w-12" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
