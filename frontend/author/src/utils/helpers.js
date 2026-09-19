export function getContentPreview(text, maxLength = 80) {
  const plain = String(text || "").trim();
  if (!plain) return "Untitled Story";
  const preview = plain.slice(0, maxLength).replace(/\s+/g, " ").trim();
  return plain.length > maxLength ? preview + "..." : preview;
}

/** Word count for a plain-text story body. */
export function countWords(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** "3h ago" style relative time — one label doesn't need a date library. */
export function getTimeAgo(date) {
  const then = new Date(date).getTime();
  if (!then) return "";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const units = [
    [31536000, "y"],
    [2592000, "mo"],
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];

  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }

  return "just now";
}

/**
 * Instagram-style like caption from the recent likers and the total count:
 * "Liked by Priya" / "Liked by Priya and Ravi" / "Liked by Priya and 40 others".
 */
export function formatLikesCaption(recentLikers, totalLikes) {
  const count = Number(totalLikes) || 0;
  if (count <= 0) return "";

  const known = (recentLikers || []).map((l) => l?.fullName).filter(Boolean).slice(0, count);

  if (count === 1) return known[0] ? `Liked by ${known[0]}` : "";

  if (known.length === count) {
    if (count === 2) return `Liked by ${known[0]} and ${known[1]}`;
    return `Liked by ${known.slice(0, -1).join(", ")} and ${known[known.length - 1]}`;
  }

  const others = count - 1;
  const firstName = known[0] || "Someone";
  return `Liked by ${firstName} and ${others} other${others === 1 ? "" : "s"}`;
}

/**
 * Sanitize a raw string into a valid author username.
 * Rules:
 * - Lowercase only
 * - Only a-z, 0-9, dots, hyphens, underscores allowed
 * - No leading/trailing special characters
 * - Max 30 characters
 */
export function sanitizeUsername(raw) {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}
