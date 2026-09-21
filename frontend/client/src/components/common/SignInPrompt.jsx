import { Link } from "react-router-dom";
import { Icons } from "../../icons";

/**
 * "Sign in to continue" — shown by the pages that need an account (profile,
 * booking, bookings, expert matching) so they all ask the same way.
 *
 * `showRegister` adds the "create an account" way out, for the pages someone
 * can only reach through a link they were sent.
 */
export default function SignInPrompt({
  title = "Sign in to continue",
  description,
  actionLabel = "Log In",
  showRegister = false,
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
      <div className="mx-auto max-w-xl space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icons.lock className="h-7 w-7" />
        </div>

        <h1 className="font-display text-3xl font-extrabold text-foreground">
          {title}
        </h1>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:w-auto"
          >
            <Icons.login className="h-4 w-4" />
            {actionLabel}
          </Link>

          {showRegister && (
            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted sm:w-auto"
            >
              <Icons.userAdd className="h-4 w-4" />
              Create an account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
