import { SESSION_TYPES, formatDay } from "../utils";

/** The shared look of a chosen option. */
const optionClass = (active, { block = false } = {}) =>
  `rounded-xl border transition-all duration-200 ${
    active
      ? "border-accent bg-accent/[0.06] ring-1 ring-accent/40"
      : "border-border/70 hover:border-accent/40"
  } ${block ? "p-4 text-left" : "px-4 py-2.5 text-center"}`;

/** How the session happens: video, audio or chat. */
export function SessionTypePicker({ value, onChange }) {
  return (
    <fieldset className="mt-7">
      <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Session type
      </legend>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SESSION_TYPES.map((type) => {
          const Icon = type.icon;
          const active = value === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={optionClass(active, { block: true })}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  active ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-sm font-bold text-foreground">
                {type.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                {type.desc}
              </p>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Which day — changing it clears any time already picked. */
export function DayPicker({ days, value, onChange }) {
  return (
    <fieldset className="mt-7">
      <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Pick a day
      </legend>

      <div className="mt-3 flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onChange(day)}
            className={optionClass(value === day)}
          >
            <span className="block text-xs font-bold text-foreground">
              {formatDay(day)}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Which slot on that day. */
export function TimeSlotPicker({ slots, value, onChange }) {
  return (
    <fieldset className="mt-7">
      <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Pick a time
      </legend>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onChange(slot)}
            className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
              value === slot
                ? "border-accent bg-accent text-white"
                : "border-border/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
