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

// Instagram-style like caption built from the recent likers + total count.
// e.g. "Liked by Priya" / "Liked by Priya and Ravi" / "Liked by Priya and 40 others"
export function formatLikesCaption(recentLikers, totalLikes) {
  const count = Number(totalLikes) || 0;
  if (count <= 0) return "";

  const names = (recentLikers || [])
    .map((l) => l?.fullName)
    .filter(Boolean);
  const known = names.slice(0, count);

  if (count === 1) {
    return known[0] ? `Liked by ${known[0]}` : "";
  }

  if (known.length === count) {
    if (count === 2) return `Liked by ${known[0]} and ${known[1]}`;
    return `Liked by ${known.slice(0, -1).join(", ")} and ${known[known.length - 1]}`;
  }

  const others = count - 1;
  const firstName = known[0] || "Someone";
  return `Liked by ${firstName} and ${others} other${others === 1 ? "" : "s"}`;
}


