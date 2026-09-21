import { Icons } from "../../icons";

/** The ways a session can happen. */
export const SESSION_TYPES = [
  {
    id: "video",
    label: "Video Call",
    icon: Icons.videoCamera,
    desc: "Face-to-face on a video call",
  },
  {
    id: "audio",
    label: "Audio Call",
    icon: Icons.phone,
    desc: "Talk over a phone call",
  },
  {
    id: "chat",
    label: "Chat Session",
    icon: Icons.chat,
    desc: "Text-based coaching session",
  },
];

export const sessionTypeLabel = (id) =>
  SESSION_TYPES.find((type) => type.id === id)?.label || "";

/** The expert's initials, with the "Dr." prefix dropped. */
export function initials(name) {
  return (name || "")
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** "Mon, Mar 3" — a bookable day. */
export function formatDay(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * What the person asked for on the matching form, carried over so the booking
 * form starts pre-filled.
 */
export function readConsultContext() {
  try {
    const raw = sessionStorage.getItem("lifebookz-consult-context");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** The price as it is shown, or "Free" when the expert charges nothing. */
export function priceLabel(price) {
  return price ? `$${price}` : "Free";
}
