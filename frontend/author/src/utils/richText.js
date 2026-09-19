/**
 * Story content helpers.
 *
 * Stories are written in a small rich-text editor and stored as HTML —
 * only paragraph breaks, inline emphasis and lists are produced. These
 * helpers keep rendering safe: every tag that is not on the allow-list
 * (and every attribute) is dropped before HTML reaches the DOM, and
 * text-only surfaces never have to show raw markup.
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

/** Markup-free version of the content, for previews, search and word counts. */
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

/**
 * Converts legacy plain-text content into editor-ready HTML so that old
 * stories keep their line breaks when they are opened for editing.
 */
export function plainTextToHtml(value) {
  if (typeof value !== "string" || !value) return "";
  if (looksLikeHtml(value)) return sanitizeRichText(value);

  const escape = (text) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return value
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p>${escape(block).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

/** Word count that ignores markup. */
export function countWords(value) {
  const text = richTextToPlain(value).trim();
  return text ? text.split(/\s+/).length : 0;
}
