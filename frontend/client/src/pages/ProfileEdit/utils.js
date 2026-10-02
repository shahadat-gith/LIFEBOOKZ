/**
 * Everything profile *editing* derives rather than renders: the crop each
 * image slot needs, and the multipart body the save sends. The read-only
 * profile's derivations live in `../Profile/utils`.
 */

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * The crop dialog's settings for the slot being cropped. The avatar is
 * square and shown in a circle; the cover is always 16:9 — one image that
 * works on every screen size.
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

  return {
    aspect: 16 / 9,
    circular: false,
    title: "Position your cover image",
    hint: "Drag to choose which part shows — the frame stays 16:9 on every screen.",
  };
}

/**
 * The multipart body for a save. Only the fields being changed are
 * included, so an image-only save never touches the name (and vice versa)
 * and an untouched image keeps its stored file.
 */
export function buildProfileFormData({ fullName, avatarFile, coverFile }) {
  const payload = new FormData();

  if (fullName !== undefined && fullName !== null) {
    payload.append("fullName", fullName);
  }
  if (avatarFile) payload.append("avatar", avatarFile, "avatar.jpg");
  if (coverFile) payload.append("coverImage", coverFile, "cover.jpg");

  return payload;
}
