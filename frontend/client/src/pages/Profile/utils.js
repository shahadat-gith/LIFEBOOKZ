import { Icons } from "../../icons";

/**
 * Everything the profile page derives rather than renders: the cover
 * variants it offers, the crop each one needs, how a booking list summarises
 * into the stat tiles, and the multipart body the save sends.
 */

/** Cover variants — a wide banner for desktops, a tighter crop for phones. */
export const COVER_VARIANTS = [
  {
    key: "desktop",
    label: "Desktop cover",
    ratio: "16:9",
    aspect: 16 / 9,
    icon: Icons.desktop,
    hint: "Wide banner shown on laptops and desktops",
  },
  {
    key: "mobile",
    label: "Mobile cover",
    ratio: "4:3",
    aspect: 4 / 3,
    icon: Icons.mobile,
    hint: "Taller crop shown on phones",
  },
];

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** "March 2026" — when the account was created. */
export function formatJoined(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/**
 * The crop dialog's settings for the slot being cropped. Avatars are square
 * and shown in a circle; each cover uses the ratio it will be displayed at.
 */
export function cropConfigFor(kind) {
  if (kind === "avatar") {
    return {
      aspect: 1,
      circular: true,
      title: "Crop your profile photo",
      hint: "This is how your photo appears in the circular avatar.",
    };
  }

  const variant = COVER_VARIANTS.find((v) => v.key === kind);

  if (kind === "mobile") {
    return {
      aspect: variant.aspect,
      circular: false,
      title: "Crop your mobile cover",
      hint: "Shown on phones.",
    };
  }

  return {
    aspect: variant.aspect,
    circular: false,
    title: "Crop your desktop cover",
    hint: "Shown on laptops and desktops.",
  };
}

/** The booking list as the four stat tiles read it. */
export function summarizeBookings(bookings = []) {
  return {
    total: bookings.length,
    upcoming: bookings.filter((b) =>
      ["pending", "confirmed"].includes(b.status),
    ).length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };
}

/**
 * The multipart body the save sends. Only slots with a new file are
 * included, so an untouched cover keeps its stored image.
 */
export function buildProfileFormData({ fullName, avatarFile, covers }) {
  const payload = new FormData();
  payload.append("fullName", fullName);

  if (avatarFile) payload.append("avatar", avatarFile, "avatar.jpg");
  if (covers.desktop) {
    payload.append("coverImage", covers.desktop, "cover-desktop.jpg");
  }
  if (covers.mobile) {
    payload.append("coverImageMobile", covers.mobile, "cover-mobile.jpg");
  }

  return payload;
}
