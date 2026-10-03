import { Icons } from "../../../icons";
import Button from "../../../components/ui/Button";
import Field, { fieldControlClass } from "../../../components/ui/Field";
import { coachCategories } from "../../../data/coaches";
import { priceLabel } from "../utils";

/**
 * The request form: what help is needed and which category. No time-picking —
 * the expert confirms the session when they are free, and the user is emailed
 * the meeting room link. Payment happens at the room door.
 */
export default function BookingForm({
  expert,
  problem,
  onProblemChange,
  category,
  onCategoryChange,
  notes,
  onNotesChange,
  submitting,
  onSubmit,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs sm:p-8"
    >
      <h2 className="font-display text-2xl font-extrabold text-foreground">
        Request a session
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell {expert.fullName?.split(" ")[0] || "the expert"} what you need help
        with — they&apos;ll confirm your session from their dashboard.
      </p>

      <Field
        label="What would you like help with?"
        htmlFor="booking-problem"
        className="mt-7"
      >
        <textarea
          id="booking-problem"
          rows={5}
          value={problem}
          onChange={(e) => onProblemChange(e.target.value)}
          placeholder="Describe your situation so the expert can prepare"
          className={fieldControlClass}
        />
      </Field>

      <Field label="Category" htmlFor="booking-category" className="mt-6">
        <select
          id="booking-category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={fieldControlClass}
        >
          <option value="">Select a category…</option>
          {coachCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Additional notes"
        htmlFor="booking-notes"
        hint="(optional)"
        className="mt-6"
      >
        <textarea
          id="booking-notes"
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add anything else the expert should know"
          className={fieldControlClass}
        />
      </Field>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            Session fee — paid when you join
          </p>
          <p className="font-display text-2xl font-extrabold text-foreground">
            {priceLabel(expert.price)}
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          className="w-full rounded-full px-8 sm:w-auto"
        >
          <Icons.checkCircle className="h-4 w-4" />
          Send request
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground sm:text-right">
        You&apos;ll only pay when you enter the meeting room.
      </p>
    </form>
  );
}
