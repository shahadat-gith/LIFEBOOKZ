export function getContentPreview(html, maxLength = 80) {
  const plain = html.replace(/<[^>]*>/g, "").trim();
  if (!plain) return "";
  const preview = plain.slice(0, maxLength).replace(/\s+/g, " ").trim();
  return plain.length > maxLength ? preview + "..." : preview;
}

export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").trim();
}



import moment from "moment";

export function getTimeAgo(date) {
  return moment(date).fromNow();
}

export function formatDate(date, format = "MMM D, YYYY") {
  return moment(date).format(format);
}



// Helper to strip HTML tags for fixed text snippets
export function getPlainTextSnippet(htmlContent, maxLength = 180) {
  if (!htmlContent) return "";
  const plainText = htmlContent.replace(/<[^>]+>/g, "").trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + "...";
}
