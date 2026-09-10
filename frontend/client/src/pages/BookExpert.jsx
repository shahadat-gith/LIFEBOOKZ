import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icons } from "../icons";
import Button from "../components/ui/Button";
import {
  getCoachById,
  getAvailableSlots,
  coachCategories,
} from "../data/coaches";

const SESSION_TYPES = [
  { id: "video", label: "Video Call", icon: Icons.videoCamera, desc: "Face-to-face on a video call" },
  { id: "audio", label: "Audio Call", icon: Icons.phone, desc: "Talk over a phone call" },
  { id: "chat", label: "Chat Session", icon: Icons.chat, desc: "Text-based coaching session" },
];

function initials(name) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function BookExpert() {
  const { expertId } = useParams();
  const coach = useMemo(() => getCoachById(expertId), [expertId]);

  const { timeSlots, days } = useMemo(() => getAvailableSlots(), []);

  const [sessionType, setSessionType] = useState("video");
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingDone, setBookingDone] = useState(false);

  const category = coachCategories.find((c) => c.id === coach?.category);

  // If the coach is missing (bad id), show a fallback
  if (!coach) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans px-4 py-16">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Icons.exclamationCircle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Coach not found
          </h1>
          <p className="text-muted-foreground text-sm">
            We couldn't find the coach you're looking for. Pick another expert
            from the list.
          </p>
          <Link
            to="/consult"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <Icons.arrowLeft className="h-4 w-4" />
            Back to coaches
          </Link>
        </div>
      </div>
    );
  }

  const handleBooking = (e) => {
    e.preventDefault();
    // Dummy booking — no backend yet. Just confirm locally.
    setBookingDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============ SUCCESS STATE ============
  if (bookingDone) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans px-4 py-16 md:py-24">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Icons.checkCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              Booking confirmed!
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Your session is booked. Here's a quick summary — a calendar
              invite will follow once payments are live.
            </p>
          </div>

          {/* Booking summary card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-left shadow-xs">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${coach.avatarColor}`}
              >
                {initials(coach.name)}
              </div>
              <div>
                <p className="font-display text-base font-bold text-foreground">
                  {coach.name}
                </p>
                <p className="text-xs text-muted-foreground">{coach.title}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Icons.chat className="h-4 w-4" />
                  Session
                </dt>
                <dd className="font-semibold text-foreground">
                  {SESSION_TYPES.find((s) => s.id === sessionType)?.label}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Icons.clock className="h-4 w-4" />
                  Date & time
                </dt>
                <dd className="font-semibold text-foreground">
                  {formatDate(date)} · {time}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Icons.document className="h-4 w-4" />
                  Category
                </dt>
                <dd className="font-semibold text-foreground">
                  {category?.label || coach.category}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-display text-lg font-extrabold text-foreground">
                  ${coach.price}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/consult"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              Back to coaches
            </Link>
            <Link
              to="/consult"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted"
            >
              Book another session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============ BOOKING FORM ============
  return (
    <div className="min-h-screen bg-background text-foreground font-sans px-4 py-10 md:py-16 selection:bg-accent/20">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back link */}
        <Link              to="/consult"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-accent"
        >
          <Icons.arrowLeft className="h-4 w-4" />
          Back to coaches
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
          {/* ============ EXPERT SIDEBAR ============ */}
          <aside className="lg:sticky lg:top-28 h-fit space-y-5">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold ${coach.avatarColor}`}
                >
                  {initials(coach.name)}
                </div>
                <div>
                  <h1 className="font-display text-xl font-extrabold text-foreground">
                    {coach.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">{coach.title}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                {category && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                    {category.label}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                  <Icons.userCheck className="h-3 w-3" />
                  {coach.sessions} sessions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                  <Icons.clock className="h-3 w-3" />
                  {coach.experience} yrs exp
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {coach.bio}
              </p>

              <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-4">
                <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                  <Icons.starSolid className="h-4 w-4" />
                  {coach.rating.toFixed(1)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icons.globe className="h-4 w-4" />
                  {coach.languages.join(", ")}
                </div>
              </div>
            </div>

            {/* Price note */}
            <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/[0.04] p-5 text-sm leading-6 text-muted-foreground">
              <p className="font-bold text-foreground">
                ${coach.price} per session
              </p>
              <p className="mt-1">
                Payments aren't live yet — this booking is a demo, so nothing
                will be charged.
              </p>
            </div>
          </aside>

          {/* ============ BOOKING FORM ============ */}
          <form
            onSubmit={handleBooking}
            className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs"
          >
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Book your session
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a time that works for you.
            </p>

            {/* Session type */}
            <fieldset className="mt-7">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Session type
              </legend>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SESSION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const active = sessionType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSessionType(type.id)}
                      className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                        active
                          ? "border-accent bg-accent/[0.06] ring-1 ring-accent/40"
                          : "border-border/70 hover:border-accent/40"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          active
                            ? "bg-accent text-white"
                            : "bg-muted text-muted-foreground"
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

            {/* Date */}
            <fieldset className="mt-7">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pick a day
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDate(d);
                      setTime("");
                    }}
                    className={`rounded-xl border px-4 py-2.5 text-center transition-all duration-200 ${
                      date === d
                        ? "border-accent bg-accent/[0.06] ring-1 ring-accent/40"
                        : "border-border/70 hover:border-accent/40"
                    }`}
                  >
                    <span className="block text-xs font-bold text-foreground">
                      {formatDate(d)}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Time */}
            <fieldset className="mt-7">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pick a time
              </legend>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                      time === slot
                        ? "border-accent bg-accent text-white"
                        : "border-border/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Notes */}
            <div className="mt-7">
              <label
                htmlFor="booking-notes"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                What would you like to work on?{" "}
                <span className="font-normal normal-case text-muted-foreground/70">
                  (optional)
                </span>
              </label>
              <textarea
                id="booking-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share a few words about what you'd like to discuss in this session..."
                className="mt-2 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>

            {/* Submit */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  ${coach.price}
                </p>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!time}
                className="w-full sm:w-auto rounded-full px-8"
              >
                <Icons.checkCircle className="h-4 w-4" />
                Confirm Booking
              </Button>
            </div>
            {!time && (
              <p className="mt-3 text-center sm:text-right text-xs text-muted-foreground">
                Select a date and time slot to confirm.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}