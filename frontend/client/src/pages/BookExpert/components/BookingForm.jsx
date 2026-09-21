import { Icons } from "../../../icons";
import Button from "../../../components/ui/Button";
import Field, { fieldControlClass } from "../../../components/ui/Field";
import { coachCategories } from "../../../data/coaches";
import {
  SessionTypePicker,
  DayPicker,
  TimeSlotPicker,
} from "./BookingPickers";
import { priceLabel } from "../utils";

/**
 * The booking form: what help is needed, which category, and when.
 *
 * All five controls are owned by the page (it needs them for the request and
 * the confirmation screen), so this is a controlled form.
 */
export default function BookingForm({
  expert,
  days,
  timeSlots,
  problem,
  onProblemChange,
  category,
  onCategoryChange,
  sessionType,
  onSessionTypeChange,
  date,
  onDateChange,
  time,
  onTimeChange,
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
        Book your session
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Share what you need help with and pick a time that works for you.
      </p>

      <Field
        label="What would you like help with?"
        htmlFor="booking-problem"
        className="mt-7"
      >
        <textarea
          id="booking-problem"
          rows={4}
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

      <SessionTypePicker value={sessionType} onChange={onSessionTypeChange} />

      <DayPicker days={days} value={date} onChange={onDateChange} />

      <TimeSlotPicker slots={timeSlots} value={time} onChange={onTimeChange} />

      <Field
        label="Additional notes"
        htmlFor="booking-notes"
        hint="(optional)"
        className="mt-7"
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
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-2xl font-extrabold text-foreground">
            {priceLabel(expert.price)}
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={!time}
          className="w-full rounded-full px-8 sm:w-auto"
        >
          <Icons.checkCircle className="h-4 w-4" />
          Confirm Booking
        </Button>
      </div>

      {!time && (
        <p className="mt-3 text-center text-xs text-muted-foreground sm:text-right">
          Select a time slot to confirm.
        </p>
      )}
    </form>
  );
}
