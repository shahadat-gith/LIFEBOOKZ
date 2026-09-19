import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import useSettings from "../hooks/useSettings";
import { Icons } from "../icons";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

/**
 * Author settings — backed by `/authors/me/settings`.
 *
 * Every switch here changes real behaviour:
 *  - default visibility seeds each new lifebook and story
 *  - autosave saves drafts while writing
 *  - the word count shows in the editor
 *  - the directory listing hides the profile from the author list
 *  - notification preferences gate the rows created for this author
 *  - two-step sign-in emails a code before a session is issued
 */

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public — anyone can read" },
  { value: "followers", label: "Followers only" },
  { value: "private", label: "Only me" },
];

const NOTIFICATION_OPTIONS = [
  {
    key: "likes",
    label: "Likes on my stories",
    hint: "When someone likes a story you published.",
  },
  {
    key: "comments",
    label: "Comments and replies",
    hint: "When a reader comments on your story.",
  },
  {
    key: "followers",
    label: "New followers",
    hint: "When someone starts following your lifebook.",
  },
];

const DEFAULT_FORM = {
  defaultVisibility: "public",
  autosave: true,
  showWordCount: true,
  inDirectory: true,
  twoStep: false,
  notifications: { likes: true, comments: true, followers: true },
};

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

/* ---------- Small building blocks ---------- */

function SectionCard({ title, description, icon: Icon, tone = "default", children }) {
  const danger = tone === "danger";

  return (
    <section
      className={`rounded-2xl border bg-card p-5 shadow-xs sm:p-6 ${
        danger ? "border-destructive/30" : "border-border/70"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h2
            className={`font-display text-lg font-bold ${
              danger ? "text-destructive" : "text-foreground"
            }`}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, hint, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/* ---------- Page ---------- */

export default function Settings() {
  const { author, logout } = useAuth();
  // Always re-read on entry: this page must show the stored values, never a
  // cached or default copy.
  const {
    settings,
    error: settingsError,
    loading: settingsLoading,
    save: saveSettings,
    refresh: reloadSettings,
  } = useSettings({ refreshOnMount: true });
  const navigate = useNavigate();
  const loaded = Boolean(settings);
  // Until the first read lands there is nothing meaningful to show — and
  // rendering defaults would let a save overwrite the real preferences.
  const showForm = loaded || (!settingsLoading && Boolean(settingsError));

  const [form, setForm] = useState(DEFAULT_FORM);
  /** idle → saving → saved/error, shown next to the section header. */
  const [status, setStatus] = useState("idle");

  // The persisted copy, so we can tell whether there is anything to save.
  const savedForm = useMemo(
    () => ({
      ...DEFAULT_FORM,
      ...(settings || {}),
      notifications: {
        ...DEFAULT_FORM.notifications,
        ...(settings?.notifications || {}),
      },
    }),
    [settings],
  );


  // Seed the form from the server copy whenever it (re)loads or is saved.
  useEffect(() => {
    setForm(savedForm);
  }, [savedForm]);

  /**
   * Every change is persisted the moment it is made — there is no save
   * button to forget, so a refresh can never bring back the old value. Only
   * the touched key is sent, and a failed save snaps the switch back to what
   * the backend actually has.
   */
  async function applyChange(nextForm, patch) {
    const previous = form;
    setForm(nextForm);
    setStatus("saving");

    try {
      await saveSettings(patch);
      setStatus("saved");
    } catch (err) {
      setForm(previous);
      setStatus("error");
      toast.error(
        err?.response?.data?.error?.message ||
          "We couldn't save that change. Please try again.",
      );
    }
  }

  const setPref = (key) => (value) =>
    applyChange({ ...form, [key]: value }, { [key]: value });

  const setNotification = (key) => (value) =>
    applyChange(
      { ...form, notifications: { ...form.notifications, [key]: value } },
      { notifications: { [key]: value } },
    );

  function handleSignOut() {
    logout();
    navigate("/login");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pt-8 pb-10"
    >
      {/* Header */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Your Account
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your account, what you share and how LifeBookz reaches you.
        </p>

        {/* Preferences come from the API — say so if they could not be read
            instead of showing defaults that a save would then overwrite. */}
        {settingsError && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <Icons.exclamationCircle className="h-4 w-4 shrink-0 text-destructive" />
            <p className="mr-auto text-xs text-muted-foreground">
              {settingsError?.response?.data?.error?.message ||
                "We couldn't load your saved settings."}
            </p>
            <Button variant="outline" size="sm" onClick={reloadSettings}>
              <Icons.refresh className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        )}
      </div>

      {!loaded && settingsLoading && (
        <div className="mx-auto mt-6 max-w-3xl space-y-3 px-4 sm:px-6" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border bg-card p-5"
            >
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-4 h-3 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      <div
        className={`mx-auto mt-6 max-w-3xl space-y-5 px-4 sm:px-6 ${
          showForm ? "" : "hidden"
        }`}
      >
        {/* Account */}
        <SectionCard
          icon={Icons.user}
          title="Account"
          description="The details tied to your author account."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              id="settings-name"
              type="text"
              value={author?.fullName || "—"}
              readOnly
              disabled
            />
            <Input
              label="Username"
              id="settings-username"
              type="text"
              value={author?.username ? `@${author.username}` : "—"}
              readOnly
              disabled
            />
            <Input
              label="Email address"
              id="settings-email"
              type="email"
              value={author?.email || "—"}
              readOnly
              disabled
              helperText="Used for sign-in and password resets."
            />
            <Input
              label="Member since"
              id="settings-joined"
              type="text"
              value={formatJoined(author?.createdAt)}
              readOnly
              disabled
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Link
              to="/profile/edit"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Icons.edit className="h-3.5 w-3.5" />
              Edit profile
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Icons.book className="h-3.5 w-3.5" />
              View my lifebook
            </Link>
          </div>
        </SectionCard>

        {/* Writing */}
        <SectionCard
          icon={Icons.edit}
          title="Writing"
          description="Defaults applied whenever you start a new story."
        >
          <div className="space-y-1">
            <Select
              label="Default story visibility"
              id="settings-default-visibility"
              options={VISIBILITY_OPTIONS}
              placeholder="Choose a default"
              value={form.defaultVisibility}
              disabled={!loaded}
              onChange={(e) => setPref("defaultVisibility")(e.target.value)}
            />

            <div className="divide-y divide-border/60 pt-2">
              <Toggle
                label="Autosave drafts as I write"
                hint="Saves your draft in the background while you write."
                checked={form.autosave}
                onChange={setPref("autosave")}
              />
              <Toggle
                label="Show the word count while writing"
                hint="A live count under the story editor."
                checked={form.showWordCount}
                onChange={setPref("showWordCount")}
              />
            </div>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={Icons.bell}
          title="Notifications"
          description="Choose which events create a notification for you."
        >
          <div className="divide-y divide-border/60">
            {NOTIFICATION_OPTIONS.map((option) => (
              <Toggle
                key={option.key}
                label={option.label}
                hint={option.hint}
                checked={form.notifications[option.key]}
                onChange={setNotification(option.key)}
              />
            ))}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Turning one off stops new notifications of that kind. Existing ones
            stay in your drawer.
          </p>
        </SectionCard>

        {/* Privacy */}
        <SectionCard
          icon={Icons.shieldCheck}
          title="Privacy"
          description="Who can discover you and read along."
        >
          <div className="divide-y divide-border/60">
            <Toggle
              label="List my profile in the author directory"
              hint="Readers browsing authors can find you by name and profession."
              checked={form.inDirectory}
              onChange={setPref("inDirectory")}
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Each chapter and story also carries its own visibility — set it while
            writing, or change it any time from your lifebook.
          </p>
        </SectionCard>

        {/* Security */}
        <SectionCard
          icon={Icons.lock}
          title="Security"
          description="Keep your account and your stories protected."
        >
          <div className="divide-y divide-border/60">
            <Toggle
              label="Two-step sign-in"
              hint="Emails a 6-digit code that must be entered after your password."
              checked={form.twoStep}
              onChange={setPref("twoStep")}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Icons.lock className="h-3.5 w-3.5" />
              Change password
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="rounded-full px-5 text-xs font-bold"
            >
              <Icons.logout className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </SectionCard>

        {/* Changes save on their own — this just reports what happened. */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {status === "saving" && (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
              Saving your change…
            </span>
          )}
          {status === "saved" && (
            <span className="inline-flex items-center gap-2 text-success">
              <Icons.check className="h-3.5 w-3.5" />
              Saved — this is now your stored preference.
            </span>
          )}
          {status === "error" && (
            <span className="text-destructive">
              That change didn't save, so the switch was put back.
            </span>
          )}
        </div>

        {/* Danger zone */}
        <SectionCard
          icon={Icons.trash}
          tone="danger"
          title="Delete account"
          description="Removes your profile, your lifebook and every story in it. This can't be undone."
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-destructive/30 px-5 text-xs font-bold text-destructive hover:bg-destructive/10"
            onClick={() =>
              toast.error(
                "Account deletion isn't available yet — please contact support.",
              )
            }
          >
            <Icons.trash className="h-3.5 w-3.5" />
            Delete my account
          </Button>
        </SectionCard>
      </div>
    </motion.div>
  );
}
