export function getContentPreview(html: string, maxLength = 80): string {
  const plain = html.replace(/<[^>]*>/g, "").trim();
  if (!plain) return "";
  const preview = plain.slice(0, maxLength).replace(/\s+/g, " ").trim();
  return plain.length > maxLength ? preview + "..." : preview;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
