import { looksLikeHtml, sanitizeRichText } from "../../utils/richText";

/**
 * Renders stored story content.
 *
 * Rich-text stories render through the sanitized allow-list; older plain
 * text stories keep their line breaks exactly as written.
 */
export default function RichText({ content, className = "", as: Tag = "div" }) {
  const value = typeof content === "string" ? content : "";
  if (!value.trim()) return null;

  if (!looksLikeHtml(value)) {
    return <Tag className={`whitespace-pre-line ${className}`}>{value}</Tag>;
  }

  return (
    <Tag
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) }}
    />
  );
}
