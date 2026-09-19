/**
 * Share a story with the Web Share API, falling back to copying the link.
 * Mirrors the client portal's helper so sharing behaves identically.
 */
export async function share({
  title,
  text = "",
  url = window.location.href,
  fallbackToClipboard = true,
} = {}) {
  const shareUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url: shareUrl });
      return true;
    }

    if (fallbackToClipboard && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    }

    return false;
  } catch (error) {
    // The user dismissed the share sheet — not a failure worth reporting.
    if (error?.name === "AbortError") return false;

    console.error("Share failed:", error);
    return false;
  }
}
