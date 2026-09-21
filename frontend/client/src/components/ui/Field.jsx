/**
 * A labelled form row.
 *
 * Every form in the portal labels its inputs the same way — a small uppercase
 * legend above the control, with an optional hint beside it — so the wrapper
 * lives here rather than being retyped in each form.
 */
export default function Field({ label, htmlFor, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >
        {label}
        {hint && (
          <span className="font-normal normal-case text-muted-foreground/70">
            {" "}
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

/** The shared look of a text input or textarea inside a `Field`. */
export const fieldControlClass =
  "mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";
