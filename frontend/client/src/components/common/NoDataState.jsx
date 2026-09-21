import { Link } from "react-router-dom";
import { Icons } from "../../icons";
import Button from "../ui/Button";

/**
 * The call to action. `to` renders a link, `onClick` a button — so an empty
 * state can send someone to another page without reloading the app.
 */
function Action({ action, className = "" }) {
  if (!action) return null;

  const icon = action.icon || <Icons.plus className="h-4 w-4" />;

  if (action.to) {
    return (
      <Link
        to={action.to}
        className={`inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 ${className}`}
      >
        {icon}
        {action.label}
      </Link>
    );
  }

  return (
    <Button
      variant="primary"
      onClick={action.onClick}
      icon={icon}
      className={className}
    >
      {action.label}
    </Button>
  );
}

/**
 * "There is nothing here yet" — one component for every list that can come
 * back empty, so an empty feed, an empty booking list and an empty search all
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
        <Action action={action} className="mt-5" />
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
      <h3 className="mb-1 text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <Action action={action} />
    </div>
  );
}
