/**
 * Minimal HTML sanitizer for authored rich text.
 *
 * Story content is written in the portal's rich-text editor, which only
 * ever produces paragraph breaks, inline emphasis and lists. Anything
 * else — scripts, images, styles, event handlers, arbitrary attributes —
 * is removed here so stored content is always safe to render. Tags that
 * are not on the allow-list are dropped (their text content is kept).
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
]);

/** Elements stripped together with everything inside them. */
const DANGEROUS_BLOCKS =
  /<(script|style|iframe|object|embed|svg|math|form|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const DANGEROUS_VOID =
  /<(script|style|iframe|object|embed|svg|math|form|input|link|meta|base)\b[^>]*\/?>/gi;

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;

export function sanitizeHtml(value) {
  if (typeof value !== "string" || !value) return "";

  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(DANGEROUS_BLOCKS, "")
    .replace(DANGEROUS_VOID, "")
    .replace(TAG, (_match, slash, tag) => {
      const name = String(tag).toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";
      // Attributes are intentionally dropped.
      return `<${slash ? "/" : ""}${name}>`;
    })
    .trim();
}

/** Markup-free version of the content, for search and previews. */
export function htmlToText(value) {
  if (typeof value !== "string" || !value) return "";

  return sanitizeHtml(value)
    .replace(/<\/(p|li|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Only strip things that really look like tags, so plain text such as
    // "10 < 20" survives intact.
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
