/**
 * Everything the read-only profile page derives rather than renders: how a
 * booking list summarises into the stat tiles, and when the member joined.
 * Profile-editing derivations live in `../ProfileEdit/utils`.
 */

/** "March 2026" — when the account was created. */
export function formatJoined(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** The booking list as the four stat tiles read it. */
export function summarizeBookings(bookings = []) {
  return {
    total: bookings.length,
    upcoming: bookings.filter((b) =>
      ["pending", "confirmed"].includes(b.status),
    ).length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };
}
