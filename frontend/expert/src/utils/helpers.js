/**
 * The API's message for a failed request, plus any per-field errors it sent.
 *
 * `fields` names the input that was rejected (`{ password: "Incorrect password." }`),
 * so a form can mark that input alongside showing the message.
 */
export function apiError(error, fallback = "Something went wrong. Please try again.") {
  const payload = error?.response?.data?.error;
  return { message: payload?.message || fallback, fields: payload?.fields || {} };
}

/**
 * Sanitize a raw string into a valid expert username.
 * Rules: lowercase, a-z/0-9/./-/_ only, no leading/trailing separators, max 30.
 */
export function sanitizeUsername(raw) {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

export function formatDate(value, options) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(
    undefined,
    options || { year: "numeric", month: "short", day: "numeric" },
  );
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
