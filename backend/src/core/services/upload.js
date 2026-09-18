/**
 * Server-side upload helpers for small assets (avatars, covers, documents)
 * that arrive via multer. Story media does NOT go through here — those use
 * presigned URLs and upload directly from the browser to R2
 * (see core/config/r2.js + modules/story/media.controller.js).
 *
 * Storage layout (role-scoped so each account type owns its own folders):
 *   authors/avatars/…        authors/covers/…        authors/covers-mobile/…
 *   experts/avatars/…        experts/covers/…        experts/covers-mobile/…
 *   users/avatars/…          users/covers/…          users/covers-mobile/…
 *   stories/covers/…         documents/…
 */
import { nanoid } from "nanoid";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3, BUCKET, buildPublicUrl, deleteObject } from "../config/r2.js";
import { StorageError } from "../utils/errors.js";

/** Account roles → their top-level storage folder. */
const ROLE_FOLDER = {
  author: "authors",
  expert: "experts",
  user: "users",
};

/** Kind → sub-folder (covers have a desktop and a mobile variant). */
const KIND_FOLDER = {
  avatar: "avatars",
  cover: "covers",
  coverMobile: "covers-mobile",
  storyCover: "stories/covers",
  document: "documents",
};

export const UPLOAD_KINDS = Object.keys(KIND_FOLDER);

function extFrom(contentType = "") {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("pdf")) return "pdf";
  return "jpg";
}

/**
 * Build the R2 object key for an upload.
 * @param {"author"|"expert"|"user"} role
 * @param {keyof KIND_FOLDER} kind
 */
export function buildUploadKey(role, kind, contentType) {
  const roleFolder = ROLE_FOLDER[role];
  const sub = KIND_FOLDER[kind] || "misc";

  // Role-scoped for account assets, flat for shared kinds.
  const folder = roleFolder ? `${roleFolder}/${sub}` : sub;

  return `${folder}/${Date.now()}-${nanoid(12)}.${extFrom(contentType)}`;
}

async function uploadBuffer(buffer, contentType, role, kind) {
  const key = buildUploadKey(role, kind, contentType);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      }),
    );
  } catch (error) {
    // Surface storage failures (bad credentials, missing permissions,
    // misconfigured bucket) as a clear 502 instead of a raw 500.
    console.error(`[r2] Upload failed for ${key}:`, error.message);
    throw new StorageError(
      "Could not store the uploaded file. The file storage service rejected the request — check the R2 credentials and token permissions.",
    );
  }

  // R2 shape: { url, key } — no Cloudinary-style publicId
  return { url: buildPublicUrl(key), key };
}

/* ---------- Role-scoped uploads ---------- */

/**
 * Profile picture for an account type.
 * @param {Buffer} buffer
 * @param {string} contentType
 * @param {"author"|"expert"|"user"} role
 */
export const uploadAvatar = (buffer, contentType = "image/jpeg", role = "author") =>
  uploadBuffer(buffer, contentType, role, "avatar");

/**
 * Profile cover for an account type.
 * @param {Buffer} buffer
 * @param {string} contentType
 * @param {"author"|"expert"|"user"} role
 * @param {"desktop"|"mobile"} variant  covers/ vs covers-mobile/
 */
export const uploadCover = (
  buffer,
  contentType = "image/jpeg",
  role = "author",
  variant = "desktop",
) =>
  uploadBuffer(
    buffer,
    contentType,
    role,
    variant === "mobile" ? "coverMobile" : "cover",
  );

/* ---------- Shared uploads ---------- */

/** Lifebook (story) cover image — not role-scoped. */
export const uploadStoryImage = (buffer, contentType = "image/jpeg") =>
  uploadBuffer(buffer, contentType, null, "storyCover");

export const uploadDocument = (buffer, contentType = "application/pdf") =>
  uploadBuffer(buffer, contentType, null, "document");

/**
 * Replace an account image, cleaning up the object it supersedes.
 * Deletion is best-effort so a stale file never blocks a successful save.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer
 * @param {string} params.contentType
 * @param {string} params.role
 * @param {"avatar"|"cover"|"coverMobile"} params.kind
 * @param {string} [params.previousKey]  key of the image being replaced
 * @returns {Promise<{url: string, key: string}>}
 */
export async function replaceImage({
  buffer,
  contentType,
  role,
  kind,
  previousKey,
}) {
  const uploaded =
    kind === "avatar"
      ? await uploadAvatar(buffer, contentType, role)
      : await uploadCover(
          buffer,
          contentType,
          role,
          kind === "coverMobile" ? "mobile" : "desktop",
        );

  if (previousKey) {
    await deleteFile(previousKey);
  }

  return uploaded;
}

/** Delete a stored object by R2 key (or a full URL). Best-effort. */
export async function deleteFile(keyOrUrl) {
  if (!keyOrUrl) return;

  return deleteObject({ key: keyOrUrl, url: keyOrUrl });
}
