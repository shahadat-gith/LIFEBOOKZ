/** How each booking status is labelled and coloured. */
export const STATUS_STYLES = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
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

/** Only a session that hasn't happened yet can be cancelled. */
export const CANCELLABLE = ["pending", "confirmed"];

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

/** "Mon, Mar 3" — when the session is booked for. */
export function formatSessionDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Mar 3" — when the request was made. */
export function formatBookedDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
