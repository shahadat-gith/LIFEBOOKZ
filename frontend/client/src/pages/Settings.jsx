import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../icons";
import Input from "../components/ui/Input";
import { PORTALS, portalLoginUrl } from "../config/portals";

function formatJoined(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SectionCard({ title, description, children, tone = "default" }) {
  const border =
    tone === "danger" ? "border-destructive/30" : "border-border/70";

  return (
    <section className={`rounded-2xl border ${border} bg-card p-5 shadow-xs sm:p-6`}>
      <div className="mb-4">
        <h2
          className={`font-display text-lg font-bold ${
            tone === "danger" ? "text-destructive" : "text-foreground"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Settings() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Leaving the page should always reset the destructive confirmation.
    return () => setConfirmingDelete(false);
  }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      await api.delete("/users/me");
      await logout();
      toast.success("Your account has been deleted.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "We couldn't delete your account. Please try again.",
      );
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground">
        <div className="mx-auto max-w-xl space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icons.lock className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Sign in to manage your settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Account, security and portal access are tied to your session.
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

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Your Account
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Settings
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Review your account details, security and access to the other
            LifeBookz portals.
          </p>
        </header>

        {/* Account */}
        <SectionCard
          title="Account"
          description="These details identify your LifeBookz account."
        >
          <div className="space-y-4">
            <Input
              label="Email address"
              id="email"
              type="email"
              value={user?.email || "—"}
              readOnly
              disabled
              helperText="Used for sign-in and password resets."
            />
            <Input
              label="Username"
              id="username"
              type="text"
              value={user?.username ? `@${user.username}` : "—"}
              readOnly
              disabled
              helperText="Your unique handle on LifeBookz."
            />
            <Input
              label="Member since"
              id="member-since"
              type="text"
              value={formatJoined(user?.createdAt)}
              readOnly
              disabled
            />
          </div>

          <div className="mt-5 border-t border-border/60 pt-4">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Icons.edit className="h-3.5 w-3.5" />
              Edit profile
            </Link>
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard
          title="Security"
          description="Reset your password with a one-time code sent to your email."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Icons.lock className="h-3.5 w-3.5" />
              Change password
            </Link>
            <Link
              to="/bookings"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Icons.book className="h-3.5 w-3.5" />
              My Bookings
            </Link>
          </div>
        </SectionCard>

        {/* Portals */}
        <SectionCard
          title="Portals & access"
          description="LifeBookz runs separate portals for each role. Each one signs in independently."
        >
          <ul className="divide-y divide-border/60">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;

              return (
                <li key={portal.id}>
                  <a
                    href={portalLoginUrl(portal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {portal.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {portal.tagline}
                      </span>
                    </span>

                    <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-bold text-muted-foreground transition-colors group-hover:text-foreground sm:inline-flex">
                      Sign in
                      <Icons.externalLink className="h-3 w-3" />
                    </span>
                    <Icons.chevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 sm:hidden" />
                  </a>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        {/* Danger zone */}
        <SectionCard
          title="Delete account"
          tone="danger"
          description="Permanently remove your account, along with your profile and booking history. This can't be undone."
        >
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <span className="mr-auto text-xs font-semibold text-destructive">
                Delete your account permanently?
              </span>

              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Keep my account
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? (
                  <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icons.trash className="h-3.5 w-3.5" />
                )}
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-5 py-2.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10"
            >
              <Icons.trash className="h-3.5 w-3.5" />
              Delete my account
            </button>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
