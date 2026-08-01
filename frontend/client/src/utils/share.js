// utils/share.js

export async function share({
  title,
  text = "",
  url = window.location.href,
  fallbackToClipboard = true,
} = {}) {
  const shareUrl = url.startsWith("http")
    ? url
    : `${window.location.origin}${url}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });

      return true;
    }

    if (fallbackToClipboard && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    }

    return false;
  } catch (error) {
    // User cancelled the share dialog
    if (error?.name === "AbortError") {
      return false;
    }

    console.error("Share failed:", error);
    return false;
  }
}
