import { Icons } from "../../../icons";
import FormError from "../../../components/common/FormError";
import { SESSION_TYPES, categoryOptions } from "../utils";

/** The icon shown for each session type. */
const SESSION_ICONS = {
  video: Icons.videoCamera,
  audio: Icons.phone,
  chat: Icons.chat,
};

const FIELD_CLASS =
  "mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

const LABEL_CLASS =
  "text-xs font-bold uppercase tracking-wider text-muted-foreground";

/**
 * The whole consult brief — what is going on, which category, how the person
 * would like to talk, and anything else — in one form.
 *
 * The page owns the values and does the matching; this only lays them out
 * and reports changes.
 */
export default function ConsultForm({
  problem,
  onProblemChange,
  category,
  onCategoryChange,
  sessionType,
  onSessionTypeChange,
  details,
  onDetailsChange,
  error,
  loading,
  onSubmit,
}) {
  const options = categoryOptions();

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs sm:p-8"
    >
      {/* Problem */}
      <div>
        <label htmlFor="consult-problem" className={LABEL_CLASS}>
          What problem are you facing?
        </label>
        <textarea
          id="consult-problem"
          rows={5}
          value={problem}
          onChange={(e) => onProblemChange(e.target.value)}
          placeholder="Describe what you're going through"
          className={FIELD_CLASS}
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          The more context you share, the better your matches.
        </p>
      </div>

      {/* Category + session type */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="consult-category" className={LABEL_CLASS}>
            Category
          </label>
          <select
            id="consult-category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Select a category…</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className={LABEL_CLASS}>Preferred session</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SESSION_TYPES.map((type) => {
              const Icon = SESSION_ICONS[type.id] || Icons.chat;
              const active = sessionType === type.id;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onSessionTypeChange(type.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-bold transition-all duration-200 ${
                    active
                      ? "border-accent bg-accent/[0.06] text-foreground ring-1 ring-accent/40"
                      : "border-border/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-accent" : ""}`} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extra context */}
      <div className="mt-6">
        <label htmlFor="consult-details" className={LABEL_CLASS}>
          Anything else we should know?{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (optional)
          </span>
        </label>
        <textarea
          id="consult-details"
          rows={3}
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder="Add more context about your situation"
          className={FIELD_CLASS}
        />
      </div>

      <FormError className="mt-4">{error}</FormError>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          Matches are ranked by expert rating and relevance.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <>
              <Icons.spinner className="h-4 w-4 animate-spin" />
              Finding your experts…
            </>
          ) : (
            <>
              <Icons.search className="h-4 w-4" />
              Find Matching Experts
            </>
          )}
        </button>
      </div>
    </form>
  );
}
