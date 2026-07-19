export function getContentPreview(html, maxLength = 80) {
 const plain = html.replace(/<[^>]*>/g, "").trim();
 if (!plain) return "Untitled Story";
 const preview = plain.slice(0, maxLength).replace(/\s+/g, " ").trim();
 return plain.length > maxLength ? preview + "..." : preview;
}

export function stripHtml(html) {
 return html.replace(/<[^>]*>/g, "").trim();
}
