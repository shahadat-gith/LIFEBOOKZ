import { Link } from "react-router-dom";
import { Icons } from "../../../icons";
import { getCategoryLabel } from "../../../data/coaches";
import { initials, sessionTypeLabel, priceLabel, formatDay } from "../utils";

/** One row of the confirmation summary. */
function SummaryRow({ icon: Icon, label, value, last = false }) {
  return (
    <div
      className={`flex items-center justify-between ${
        last ? "border-t border-border/60 pt-3" : ""
      }`}
    >
      <dt className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}

/**
 * "Booking request sent" — what was asked for, and the two sensible places
 * to go next.
 */
export default function BookingSuccess({ expert, sessionType, date, time, category }) {
  return (
    <div className="min-h-screen bg-background px-4 py-16 font-sans text-foreground md:py-24">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Icons.checkCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Booking request sent!
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {expert.fullName} will review your request and confirm the session
            shortly.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 text-left shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            {expert.avatar?.url ? (
              <img
                src={expert.avatar.url}
                alt={expert.fullName}
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-border/70"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground">
                {initials(expert.fullName)}
              </div>
            )}
            <div>
              <p className="font-display text-base font-bold text-foreground">
                {expert.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{expert.expertise}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow
              icon={Icons.chat}
              label="Session"
              value={sessionTypeLabel(sessionType)}
            />
            <SummaryRow
              icon={Icons.clock}
              label="Date &amp; time"
              value={date ? `${formatDay(date)} · ${time}` : time}
            />
            <SummaryRow
              icon={Icons.document}
              label="Category"
              value={getCategoryLabel(category)}
            />
            <SummaryRow
              label="Total"
              value={priceLabel(expert.price)}
              last
            />
          </dl>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/consult/book"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:w-auto"
          >
            Find another expert
          </Link>
          <Link
            to="/consult"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted sm:w-auto"
          >
            Back to consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
