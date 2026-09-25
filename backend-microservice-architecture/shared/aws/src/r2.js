import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { badRequestError, storageError } from "@lifebookz/shared-errors";

import { getR2Client } from "./clients.js";

/**
 * Cloudflare R2 media store.
 *
 * R2 keeps *application media* (story media, profile media, documents). It is
 * deliberately separate from AWS S3, which only holds analytics event data for
 * Athena — the two never mix.
 *
 * Uploads are presigned: the browser PUTs the file straight to R2, so a Lambda
 * never buffers a 500 MB video and API Gateway's 10 MB body limit never
 * applies. This mirrors the existing backend's design.
 */
export const MEDIA_KINDS = {
  userAvatar: "users/avatars",
  userCover: "users/covers",
  userCoverMobile: "users/covers-mobile",
  authorAvatar: "authors/avatars",
  authorCover: "authors/covers",
  authorCoverMobile: "authors/covers-mobile",
  expertAvatar: "experts/avatars",
  expertCover: "experts/covers",
  expertCoverMobile: "experts/covers-mobile",
  storyImage: "stories/media/images",
  storyVideo: "stories/media/videos",
  storyCover: "stories/covers",
  document: "documents",
};

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "video/x-msvideo", "video/mpeg"];

const DOCUMENT_TYPES = ["application/pdf"];

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB — same limit as the monolith
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB
export const DEFAULT_PRESIGN_TTL_SECONDS = 600;

function extFrom({ filename, contentType }) {
  const match = String(filename || "").match(/\.([a-zA-Z0-9]{1,8})$/);
  if (match) return match[1].toLowerCase();

  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("pdf")) return "pdf";
  if (contentType?.includes("mp4")) return "mp4";
  if (contentType?.includes("quicktime")) return "mov";
  if (contentType?.includes("webm")) return "webm";

  return "jpg";
}

/** Validate the requested content type + size against the media kind. */
export function assertUploadAllowed({ kind, contentType, size }) {
  if (!MEDIA_KINDS[kind]) {
    throw badRequestError(`Unsupported media kind "${kind}".`);
  }

  const isDocument = kind === "document";
  const allowed = isDocument ? DOCUMENT_TYPES : [...IMAGE_TYPES, ...VIDEO_TYPES];

  if (!contentType || !allowed.includes(contentType)) {
    throw badRequestError(
      isDocument
        ? "Unsupported file type. Only PDF documents are allowed."
        : "Unsupported media type. Only photos and videos are allowed.",
    );
  }

  const bytes = Number(size) || 0;
  const isVideo = VIDEO_TYPES.includes(contentType);
  const limit = isDocument ? MAX_IMAGE_BYTES : isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (bytes > limit) {
    throw badRequestError(
      isVideo ? "Videos must be 500 MB or smaller." : "Photos must be 15 MB or smaller.",
    );
  }

  return { isVideo, limit };
}

/**
 * Create the media store for one service configuration.
 *
 * @param {object} options
 * @param {string} options.endpoint          R2 S3 endpoint
 * @param {string} options.accessKeyId
 * @param {string} options.secretAccessKey
 * @param {string} options.bucket
 * @param {string} options.publicBaseUrl     r2.dev or custom public domain
 */
export function createMediaStore({ endpoint, accessKeyId, secretAccessKey, bucket, publicBaseUrl, client, presign } = {}) {
  function r2() {
    return client || getR2Client({ endpoint, accessKeyId, secretAccessKey });
  }

  function buildPublicUrl(key) {
    if (!publicBaseUrl) return key;

    return `${String(publicBaseUrl).replace(/\/$/, "")}/${key}`;
  }

  /** Extract the R2 object key from a stored URL (or pass a bare key through). */
  function objectKeyFromUrl(url) {
    if (!url) return null;

    // Anything that is not an absolute URL is already a key — including keys
    // that contain slashes (`stories/media/images/x.jpg`).
    if (!/^https?:\/\//i.test(url)) return url;

    if (publicBaseUrl && url.startsWith(publicBaseUrl)) {
      return decodeURIComponent(url.slice(publicBaseUrl.length + 1));
    }

    const match = String(url).match(new RegExp(`/${bucket}/(.+)$`));

    return match ? decodeURIComponent(match[1]) : null;
  }

  async function presignUpload({ kind, contentType, size, filename, accountId, expiresInSeconds = DEFAULT_PRESIGN_TTL_SECONDS }) {
    if (!bucket) throw storageError("Object storage is not configured (R2_BUCKET_NAME).");

    assertUploadAllowed({ kind, contentType, size });

    const folder = MEDIA_KINDS[kind];
    const owner = accountId ? `${accountId}-` : "";
    const key = `${folder}/${owner}${Date.now()}-${randomUUID().slice(0, 12)}.${extFrom({ filename, contentType })}`;

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });

    const signUrl = presign || ((cmd, options) => getSignedUrl(r2(), cmd, options));
    const uploadUrl = await signUrl(command, { expiresIn: expiresInSeconds });

    return {
      uploadUrl,
      key,
      url: buildPublicUrl(key),
      expiresIn: expiresInSeconds,
      bucket,
    };
  }

  /** Best-effort delete: a stale object must never fail a save. */
  async function deleteMedia({ key, url, logger }) {
    const objectKey = key || objectKeyFromUrl(url);
    if (!objectKey || !bucket) return false;

    try {
      await r2().send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
      return true;
    } catch (error) {
      logger?.warn?.("Failed to delete R2 object", { key: objectKey, error: error.message });
      return false;
    }
  }

  return { presignUpload, deleteMedia, buildPublicUrl, objectKeyFromUrl, bucket };
}
