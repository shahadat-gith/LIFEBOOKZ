import Input from "../../../components/ui/Input";

/**
 * The editable text part of the profile: display name, with the read-only
 * email that identifies the account. Images (avatar and cover) save
 * instantly from the identity card's camera buttons instead.
 */
export default function PersonalDetailsForm({
  email,
  fullName,
  onNameChange,
  fieldError,
  onClearError,
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
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
