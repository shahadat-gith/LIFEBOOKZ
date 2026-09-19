import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { Icons } from "../icons";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

/**
 * Author settings.
 *
 * The page is a working preview: every option is interactive but nothing
 * is persisted yet (there is no preferences endpoint on the account
 * model). Account details themselves come from the signed-in author, and
 * editing them happens on the profile page.
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
    hint: "When a reader comments or answers on your story.",
  },
  {
    key: "followers",
    label: "New followers",
    hint: "When another author starts following your lifebook.",
  },
  {
    key: "digest",
    label: "Weekly writing digest",
    hint: "A Sunday summary of how your stories performed.",
  },
];

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

function Toggle({ checked, onChange, label, hint }) {
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
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
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
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({
    defaultVisibility: "public",
    autosave: true,
    showWordCount: true,
    inDirectory: true,
    twoStep: false,
  });
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    followers: true,
    digest: false,
  });

  const setPref = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }));
  const setNotification = (key) => (value) =>
    setNotifications((n) => ({ ...n, [key]: value }));

  function handleSavePreferences() {
    // Preferences are not persisted yet — the account model has no
    // preferences block. Saving is a local preview action for now.
    toast("Preferences aren't saved yet — this page is a preview.");
  }

  function handleSignOutEverywhere() {
    logout();
    navigate("/login");
    toast.success("Signed out on this device.");
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

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/5 px-4 py-3">
          <Icons.infoCircle className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p className="text-xs text-muted-foreground">
            Preferences below are a preview — they are interactive but not saved
            to your account yet.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl space-y-5 px-4 sm:px-6">
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

        {/* Writing preferences */}
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
              value={prefs.defaultVisibility}
              onChange={(e) => setPref("defaultVisibility")(e.target.value)}
            />

            <div className="divide-y divide-border/60 pt-2">
              <Toggle
                label="Autosave drafts as I write"
                hint="Keeps your work safe if you close the tab mid-sentence."
                checked={prefs.autosave}
                onChange={setPref("autosave")}
              />
              <Toggle
                label="Show the word count while writing"
                hint="A live count at the bottom of the story editor."
                checked={prefs.showWordCount}
                onChange={setPref("showWordCount")}
              />
            </div>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={Icons.bell}
          title="Notifications"
          description="Choose what shows up in your notification drawer."
        >
          <div className="divide-y divide-border/60">
            {NOTIFICATION_OPTIONS.map((option) => (
              <Toggle
                key={option.key}
                label={option.label}
                hint={option.hint}
                checked={notifications[option.key]}
                onChange={setNotification(option.key)}
              />
            ))}
          </div>
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
              checked={prefs.inDirectory}
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
              label="Two-step verification"
              hint="Requires a one-time code from your email when signing in."
              checked={prefs.twoStep}
              onChange={setPref("twoStep")}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Icons.lock className="h-3.5 w-3.5" />
              Change password
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOutEverywhere}
              className="rounded-full px-5 text-xs font-bold"
            >
              <Icons.logout className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </SectionCard>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSavePreferences}>
            <Icons.save className="h-4 w-4" />
            Save preferences
          </Button>
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
