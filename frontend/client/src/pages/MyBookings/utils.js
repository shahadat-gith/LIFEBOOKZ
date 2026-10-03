/** How each consultation status is labelled and coloured. */
export const STATUS_STYLES = {
  PENDING: {
    label: "Awaiting expert",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  CONFIRMED: {
    label: "Confirmed — join the room",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  IN_PROGRESS: {
    label: "In session",
    className:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-success/10 text-success border-success/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  EXPIRED: {
    label: "Expired",
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

const FALLBACK_STATUS = {
  className: "bg-muted text-muted-foreground border-border",
};

/** The status as shown on the card. */
export function statusStyle(status) {
  return (
    STATUS_STYLES[status] || { label: status, ...FALLBACK_STATUS }
  );
}

/** States the user may still cancel. */
export const CANCELLABLE = ["PENDING", "CONFIRMED"];

/** States where the video session can be entered. */
export const JOINABLE = ["CONFIRMED", "IN_PROGRESS"];

/** States where payment can be made (at the room door). */
export const PAYABLE = ["CONFIRMED"];

/** The expert's initials, with the "Dr." prefix dropped. */
export function initials(name) {
  return (name || "")
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** "Mar 3" — when the request was made. */
export function formatBookedDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** "12 min" / "1 h 05 min" — an actual session duration. */
export function formatDuration(seconds) {
  if (!seconds) return "";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}
