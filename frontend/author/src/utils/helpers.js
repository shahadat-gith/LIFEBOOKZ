export function getContentPreview(html, maxLength = 80) {
 const plain = html.replace(/<[^>]*>/g, "").trim();
 if (!plain) return "Untitled Story";
 const preview = plain.slice(0, maxLength).replace(/\s+/g, " ").trim();
 return plain.length > maxLength ? preview + "..." : preview;
}

export function stripHtml(html) {
 return html.replace(/<[^>]*>/g, "").trim();
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
