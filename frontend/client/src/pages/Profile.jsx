import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../icons";
import Input from "../components/ui/Input";
import ImageCropper from "../components/common/ImageCropper";

/** Cover variants — wide banner for desktops, tighter crop for phones. */
const COVER_VARIANTS = [
  {
    key: "desktop",
    label: "Desktop cover",
    ratio: "16:5",
    aspect: 16 / 5,
    icon: Icons.desktop,
    hint: "Wide banner shown on laptops and desktops",
  },
  {
    key: "mobile",
    label: "Mobile cover",
    ratio: "4:3",
    aspect: 4 / 3,
    icon: Icons.mobile,
    hint: "Taller crop shown on phones",
  },
];

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

  // Images are cropped in the browser before upload, so we hold the
  // resulting Blob plus a preview URL for each slot.
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [covers, setCovers] = useState({ desktop: null, mobile: null });
  const [coverPreviews, setCoverPreviews] = useState({
    desktop: "",
    mobile: "",
  });
  // Pending crop: { kind: 'avatar' | 'desktop' | 'mobile', src }
  const [cropping, setCropping] = useState(null);

  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);

  const [activity, setActivity] = useState(null);
  const [activityError, setActivityError] = useState(false);

  const fileInputRef = useRef(null);
  const desktopCoverRef = useRef(null);
  const mobileCoverRef = useRef(null);

  /* ---------- Seed the form from the loaded session ---------- */
  useEffect(() => {
    if (!user) return;

    setFullName(user.fullName || "");
  }, [user]);

  /* ---------- Show the stored cover images when nothing new is pending ---------- */
  useEffect(() => {
    if (!user) return;
    setCoverPreviews((prev) => ({
      desktop: prev.desktop || user.coverImage?.url || "",
      mobile: prev.mobile || user.coverImageMobile?.url || "",
    }));
  }, [user]);

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
    if (avatarFile || covers.desktop || covers.mobile) return true;
    return (fullName || "").trim() !== (user?.fullName || "").trim();
  }, [avatarFile, covers, fullName, user?.fullName]);

  /**
   * Pick a file for a slot, then open the cropper so the person can position
   * it. Only the cropped result is ever uploaded.
   */
  const handlePickImage = (kind, event) => {
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

    setCropping({ kind, src: URL.createObjectURL(file) });
  };

  /** A crop finished — park the blob until the form is saved. */
  const handleCropped = (blob, objectUrl) => {
    const kind = cropping?.kind;
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);

    if (kind === "avatar") {
      if (previewUrl?.startsWith?.("blob:")) URL.revokeObjectURL(previewUrl);
      setAvatarFile(blob);
      setPreviewUrl(objectUrl);
    } else if (kind === "desktop" || kind === "mobile") {
      if (coverPreviews[kind]?.startsWith?.("blob:")) {
        URL.revokeObjectURL(coverPreviews[kind]);
      }
      setCovers((prev) => ({ ...prev, [kind]: blob }));
      setCoverPreviews((prev) => ({ ...prev, [kind]: objectUrl }));
    }

    setCropping(null);
  };

  const cancelCrop = () => {
    if (cropping?.src?.startsWith("blob:")) URL.revokeObjectURL(cropping.src);
    setCropping(null);
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
      if (avatarFile) payload.append("avatar", avatarFile, "avatar.jpg");
      if (covers.desktop) {
        payload.append("coverImage", covers.desktop, "cover-desktop.jpg");
      }
      if (covers.mobile) {
        payload.append("coverImageMobile", covers.mobile, "cover-mobile.jpg");
      }

      await updateUser(payload);

      setAvatarFile(null);
      setCovers({ desktop: null, mobile: null });
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

        {/* Identity card — the cover swaps to the mobile crop on phones */}
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <div className="relative h-24 bg-gradient-to-r from-primary via-primary to-accent/70 sm:h-28">
            {coverPreviews.desktop || coverPreviews.mobile ? (
              <picture>
                {coverPreviews.mobile && (
                  <source media="(max-width: 639px)" srcSet={coverPreviews.mobile} />
                )}
                {coverPreviews.desktop && (
                  <img
                    src={coverPreviews.desktop}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </picture>
            ) : (
              <button
                type="button"
                onClick={() => desktopCoverRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                <Icons.image className="h-5 w-5" />
                <span className="mt-0.5 text-xs">Add a cover image</span>
              </button>
            )}
            {(coverPreviews.desktop || coverPreviews.mobile) && (
              <button
                type="button"
                onClick={() => desktopCoverRef.current?.click()}
                aria-label="Change cover image"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm transition-colors hover:bg-card"
              >
                <Icons.camera className="h-4 w-4" />
              </button>
            )}
          </div>

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
                  onChange={(e) => handlePickImage("avatar", e)}
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

          </div>
        </section>

        {/* Cover images — cropped for both large and small screens */}
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-6">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Cover images
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose and position a crop for each screen size.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COVER_VARIANTS.map((v) => {
              const preview = coverPreviews[v.key];
              const Icon = v.icon;
              return (
                <div key={v.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {v.label}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({v.ratio})
                      </span>
                    </span>
                    {preview && (
                      <button
                        type="button"
                        onClick={() => {
                          setCovers((prev) => ({ ...prev, [v.key]: null }));
                          setCoverPreviews((prev) => ({ ...prev, [v.key]: "" }));
                        }}
                        className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      (v.key === "desktop"
                        ? desktopCoverRef
                        : mobileCoverRef
                      ).current?.click()
                    }
                    className="relative w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50"
                    style={{ aspectRatio: `${v.aspect}` }}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Icons.upload className="h-5 w-5" />
                        <span className="mt-1 text-xs">Choose image</span>
                      </span>
                    )}
                  </button>
                  <p className="mt-1 text-[11px] text-muted-foreground">{v.hint}</p>
                </div>
              );
            })}
          </div>

          <input
            ref={desktopCoverRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={(e) => handlePickImage("desktop", e)}
            className="hidden"
          />
          <input
            ref={mobileCoverRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={(e) => handlePickImage("mobile", e)}
            className="hidden"
          />
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
          </section>
        </div>
      </div>

      {/* Crop dialog — avatar (1:1, circular) or either cover variant */}
      {cropping && (
        <ImageCropper
          imageSrc={cropping.src}
          aspect={
            cropping.kind === "avatar"
              ? 1
              : cropping.kind === "desktop"
                ? 16 / 5
                : 4 / 3
          }
          circular={cropping.kind === "avatar"}
          title={
            cropping.kind === "avatar"
              ? "Crop your profile photo"
              : cropping.kind === "desktop"
                ? "Crop your desktop cover"
                : "Crop your mobile cover"
          }
          hint={
            cropping.kind === "avatar"
              ? "This is how your photo appears in the circular avatar."
              : cropping.kind === "desktop"
                ? "Shown on laptops and desktops."
                : "Shown on phones."
          }
          onCropped={handleCropped}
          onCancel={cancelCrop}
        />
      )}
    </div>
  );
}
