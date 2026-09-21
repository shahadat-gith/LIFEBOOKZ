import { Icons } from "../../../icons";
import Input from "../../../components/ui/Input";

/**
 * The editable part of the profile: display name and profile photo, with the
 * read-only email that identifies the account. The save and discard buttons
 * stay disabled until something actually changed.
 */
export default function PersonalDetailsForm({
  email,
  fullName,
  onNameChange,
  fieldError,
  onClearError,
  avatarFile,
  onChooseAvatar,
  onDiscardAvatar,
  isDirty,
  saving,
  onSubmit,
  onDiscard,
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-7">
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold text-foreground">
          Personal details
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Your name and photo are shown on your testimonials and consultations.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Full name"
          id="fullName"
          name="fullName"
          type="text"
          value={fullName}
          onChange={(e) => {
            onNameChange(e.target.value);
            if (fieldError) onClearError();
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
          value={email || ""}
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
              onClick={onChooseAvatar}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Icons.image className="h-3.5 w-3.5" />
              Choose image
            </button>

            {avatarFile && (
              <button
                type="button"
                onClick={onDiscardAvatar}
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
            onClick={onDiscard}
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
  );
}
