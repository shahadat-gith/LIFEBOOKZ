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
