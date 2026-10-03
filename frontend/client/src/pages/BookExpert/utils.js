/**
 * BookExpert helpers for the simplified consultation flow.
 *
 * No availability or time-picking: the user just describes their problem and
 * sends the request. The expert confirms when they are free, and the session
 * can run for any length of time.
 */

export function initials(name) {
  return (name || "")
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** The price as it is shown, or "Free" when the expert charges nothing. */
export function priceLabel(price) {
  return price ? `₹${price}` : "Free";
}

/** What the person asked for on the matching form, carried over pre-filled. */
export function readConsultContext() {
  try {
    const raw = sessionStorage.getItem("lifebookz-consult-context");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
