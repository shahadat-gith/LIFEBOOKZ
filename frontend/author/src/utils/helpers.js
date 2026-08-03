export function getContentPreview(html, maxLength = 80) {
 const plain = html.replace(/<[^>]*>/g, "").trim();
 if (!plain) return "Untitled Story";
 const preview = plain.slice(0, maxLength).replace(/\s+/g, " ").trim();
 return plain.length > maxLength ? preview + "..." : preview;
}

/**
 * Extract plain text from a TipTap JSON document or an HTML string.
 * Mirrors the backend's extractTextFromDocument helper.
 */
export function getDocumentText(doc) {
  if (!doc) return "";

  if (typeof doc === "string") {
    return doc
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (typeof doc === "object") {
    return extractTextFromNode(doc).trim();
  }

  return String(doc).trim();
}

function extractTextFromNode(node) {
  if (!node) return "";

  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).filter(Boolean).join(" ");
  }

  return "";
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
