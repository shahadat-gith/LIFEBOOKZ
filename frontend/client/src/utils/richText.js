/**
 * Story content helpers.
 *
 * Authors write stories in a small rich-text editor which stores HTML
 * (paragraph breaks, inline emphasis and lists only). These helpers keep
 * rendering safe: anything off the allow-list — and every attribute — is
 * dropped before HTML reaches the DOM, and text-only surfaces never show
 * raw markup.
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

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  nbsp: " ",
};

/** True when the value contains markup (as opposed to legacy plain text). */
export function looksLikeHtml(value) {
  return (
    typeof value === "string" && /<\/?[a-z][a-z0-9]*(\s[^<>]*)?\/?>/i.test(value)
  );
}

/**
 * Strip everything that is not an allowed tag; all attributes go away, so
 * event handlers and styles can never survive a paste.
 */
export function sanitizeRichText(value) {
  if (typeof value !== "string" || !value) return "";

  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|iframe|object|embed|svg|math|form|input|link|meta)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    )
    .replace(
      /<(script|style|iframe|object|embed|svg|math|form|input|link|meta)\b[^>]*\/?>/gi,
      "",
    )
    .replace(
      /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g,
      (_match, slash, tag) => {
        const name = tag.toLowerCase();
        if (!ALLOWED_TAGS.has(name)) return "";
        return `<${slash ? "/" : ""}${name}>`;
      },
    )
    .trim();
}

/** Markup-free version of the content — for previews and cards. */
export function richTextToPlain(value) {
  if (typeof value !== "string" || !value) return "";
  if (!looksLikeHtml(value)) return value;

  return sanitizeRichText(value)
    .replace(/<\/(p|li|ul|ol|blockquote|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_m, code) => ENTITIES[code] ?? _m)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
