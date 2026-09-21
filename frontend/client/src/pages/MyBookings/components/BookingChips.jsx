import { Icons } from "../../../icons";
import { getCategoryLabel } from "../../../data/coaches";
import { formatBookedDate, formatSessionDate } from "../utils";

/** One chip of the booking's metadata strip. */
function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

/** Category · session type · when · when it was booked. */
export default function BookingChips({ booking }) {
  const sessionLabel =
    { video: "Video Call", audio: "Audio Call", chat: "Chat Session" }[
      booking.sessionType
    ] || booking.sessionType;

  const when = [formatSessionDate(booking.date), booking.time]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
      <Chip>
        {booking.category
          ? getCategoryLabel(booking.category)
          : "General consultation"}
      </Chip>
      {sessionLabel && <Chip icon={Icons.chat}>{sessionLabel}</Chip>}
      {when && <Chip icon={Icons.clock}>{when}</Chip>}
      <Chip icon={Icons.tag}>Booked {formatBookedDate(booking.createdAt)}</Chip>
    </div>
  );
}
