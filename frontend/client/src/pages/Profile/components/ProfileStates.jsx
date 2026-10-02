import { Link } from "react-router-dom";
import { Icons } from "../../../icons";

/** Shown while the session is still being restored. */
export function ProfileLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Shown when the session turns out to be anonymous. The route also gates on
 * sign-in, so this is the safety net rather than the expected path.
 */
export function SignedOutNotice() {
  return (
    <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
      <div className="mx-auto max-w-xl space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icons.lock className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Sign in to view your profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Your profile, bookings and preferences live in your account.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
        >
          <Icons.login className="h-4 w-4" />
          Log In
        </Link>
      </div>
    </div>
  );
}

/** The page's heading block, with its Edit Profile action. */
export function ProfileHeading({ onEdit }) {
  return (
    <header className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
        Your Account
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
          Profile
        </h1>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit Profile"
            title="Edit Profile"
            className="inline-flex items-center gap-2 rounded-full bg-primary p-3 text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Icons.edit className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
