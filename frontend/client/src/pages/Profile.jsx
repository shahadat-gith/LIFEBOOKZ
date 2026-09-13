import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../icons";
import Input from "../components/ui/Input";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function formatJoined(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-foreground">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, description }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:border-primary/25 hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <Icons.chevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);

  const [activity, setActivity] = useState(null);
  const [activityError, setActivityError] = useState(false);

  const fileInputRef = useRef(null);

  /* ---------- Seed the form from the loaded session ---------- */
  useEffect(() => {
    if (!user) return;

    setFullName(user.fullName || "");
  }, [user]);

  /* ---------- Local preview for a freshly picked avatar ---------- */
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  /* ---------- Booking activity summary ---------- */
  const loadActivity = useCallback(async () => {
    setActivityError(false);

    try {
      const res = await api.get("/consult/bookings");
      const bookings = res.data?.data || [];

      setActivity({
        total: bookings.length,
        upcoming: bookings.filter((b) =>
          ["pending", "confirmed"].includes(b.status),
        ).length,
        completed: bookings.filter((b) => b.status === "completed").length,
      });
    } catch {
      // The profile is still useful without the summary.
      setActivity(null);
      setActivityError(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadActivity();
  }, [authLoading, isAuthenticated, loadActivity]);

  const isDirty = useMemo(() => {
    if (avatarFile) return true;
    return (fullName || "").trim() !== (user?.fullName || "").trim();
  }, [avatarFile, fullName, user?.fullName]);

  const handlePickAvatar = (event) => {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file after a failed attempt
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    setAvatarFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanName = fullName.trim();

    if (cleanName.length < 2) {
      setFieldError("Full name must be at least 2 characters.");
      return;
    }

    setFieldError("");
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("fullName", cleanName);
      if (avatarFile) payload.append("avatar", avatarFile);

      await updateUser(payload);

      setAvatarFile(null);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "We couldn't save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Loading ---------- */
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

  const avatarSrc = previewUrl || user?.avatar?.url;

  return (
    <div className="min-h-screen bg-background px-4 py-10 font-sans text-foreground selection:bg-accent/20 md:py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Your Account
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Profile
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Manage how you appear across LifeBookz and keep your details up to
            date.
          </p>
        </header>

        {/* Identity card */}
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <div className="h-24 bg-gradient-to-r from-primary via-primary to-accent/70 sm:h-28" />

          <div className="flex flex-col items-center gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:gap-6 sm:px-7">
            <div className="-mt-12 shrink-0 sm:-mt-14">
              <div className="relative">
                <img
                  src={avatarSrc?.trim() || "/user.png"}
                  alt={user?.fullName || "Your avatar"}
                  className="h-24 w-24 rounded-full border-4 border-card bg-muted/40 object-cover shadow-md sm:h-28 sm:w-28"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted active:scale-95"
                >
                  <Icons.camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  onChange={handlePickAvatar}
                  className="hidden"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
              <h2 className="truncate font-display text-xl font-extrabold text-foreground sm:text-2xl">
                {user?.fullName || "LifeBookz member"}
              </h2>

              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
                {user?.username && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icons.id className="h-3.5 w-3.5" />@{user.username}
                  </span>
                )}
                {user?.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icons.mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Icons.calendar className="h-3.5 w-3.5" />
                  Joined {formatJoined(user?.createdAt)}
                </span>
              </div>
            </div>

            <div className="shrink-0 pb-1">
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                <Icons.settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={Icons.userCheck}
            label="Following"
            value={user?.stats?.following ?? 0}
            hint="Authors you follow"
          />
          <StatTile
            icon={Icons.book}
            label="Bookings"
            value={activity ? activity.total : "—"}
            hint="Consultation sessions"
          />
          <StatTile
            icon={Icons.clock}
            label="Upcoming"
            value={activity ? activity.upcoming : "—"}
            hint="Pending or confirmed"
          />
          <StatTile
            icon={Icons.checkCircle}
            label="Completed"
            value={activity ? activity.completed : "—"}
            hint="Sessions wrapped up"
          />
        </section>

        {activityError && (
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <Icons.infoCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              We couldn&apos;t load your session summary right now.
            </span>
            <button
              type="button"
              onClick={loadActivity}
              className="font-bold text-foreground underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Edit form */}
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-7">
              <div className="mb-5">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Personal details
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your name and photo are shown on your testimonials and
                  consultations.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Full name"
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldError) setFieldError("");
                  }}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  error={fieldError}
                  helperText="This is the name other members see."
                />

                <Input
                  label="Email address"
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                  helperText="Your email identifies your account and can't be changed here."
                />

                <div className="space-y-1.5">
                  <span className="block text-sm font-medium text-foreground">
                    Profile photo
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                    >
                      <Icons.image className="h-3.5 w-3.5" />
                      Choose image
                    </button>

                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Icons.close className="h-3.5 w-3.5" />
                        Undo
                      </button>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {avatarFile
                        ? `${avatarFile.name} · ready to save`
                        : "PNG, JPG or WebP up to 5 MB."}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-5">
                  {isDirty && !saving && (
                    <span className="mr-auto text-xs font-medium text-muted-foreground">
                      You have unsaved changes.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFullName(user?.fullName || "");
                      setAvatarFile(null);
                      setFieldError("");
                    }}
                    disabled={!isDirty || saving}
                    className="rounded-full border border-border px-5 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Discard
                  </button>

                  <button
                    type="submit"
                    disabled={!isDirty || saving}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icons.save className="h-3.5 w-3.5" />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Quick links */}
          <section className="space-y-3 lg:col-span-2">
            <h2 className="px-1 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Quick links
            </h2>

            <QuickLink
              to="/bookings"
              icon={Icons.book}
              label="My Bookings"
              description="Track and manage your consultation sessions."
            />
            <QuickLink
              to="/consult/book"
              icon={Icons.search}
              label="Find an Expert"
              description="Get matched with the right consultant."
            />
            <QuickLink
              to="/settings"
              icon={Icons.settings}
              label="Settings"
              description="Account, password and portal access."
            />
          </section>
        </div>
      </div>
    </div>
  );
}
