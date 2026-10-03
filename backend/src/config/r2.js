
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

import { config } from "./index.js";

const { r2 } = config;

if (!r2.accessKeyId || !r2.secretAccessKey) {
  console.warn("[r2] R2 credentials are not configured — media uploads will fail.");
}

const s3 = new S3Client({
  region: "auto",
  endpoint: r2.endpoint,
  credentials: {
    accessKeyId: r2.accessKeyId,
    secretAccessKey: r2.secretAccessKey,
  },
  // R2 only supports path-style URLs (endpoint/bucket/key) — the SDK's
  // default virtual-host style (bucket.endpoint) gets AccessDenied.
  forcePathStyle: true,
  // R2 rejects the CRC checksum headers/query params the SDK adds by
  // default — only send them when the API actually requires it.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET = r2.bucketName;

const FOLDERS = {
  image: "stories/media/images",
  video: "stories/media/videos",
  avatar: "avatars",
  cover: "covers",
};

/** Publicly accessible URL for an object key. */
export function buildPublicUrl(key) {
  if (!r2.publicBaseUrl) return key;

  return `${r2.publicBaseUrl.replace(/\/$/, "")}/${key}`;
}

/** Extract the object key from a stored URL (or pass a bare key through). */
export function objectKeyFromUrl(url) {
  if (!url) return null;
  if (!url.includes("/")) return url; // already a key

  // Strip the public base URL prefix when it matches
  if (r2.publicBaseUrl && url.startsWith(r2.publicBaseUrl)) {
    return decodeURIComponent(url.slice(r2.publicBaseUrl.length + 1));
  }

  // Last resort: the key is everything after the bucket name
  const match = url.match(new RegExp(`/${r2.bucketName}/(.+)$`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Mint a presigned PUT URL. The client uploads the file DIRECTLY to R2.
 *
 * @param {Object} params
 * @param {"image"|"video"|"avatar"|"cover"} params.kind
 * @param {string} params.contentType  MIME type of the file
 * @param {string} [params.ext]        file extension (e.g. "jpg", "mp4")
 * @param {number} [params.expiresInSeconds]
 * @returns {Promise<{uploadUrl: string, key: string, url: string, expiresIn: number}>}
 */
export async function createPresignedUpload({
  kind = "image",
  contentType,
  ext = "",
  expiresInSeconds = 600,
}) {
  if (!BUCKET) {
    throw new Error("R2 bucket is not configured.");
  }
  if (!contentType) {
    throw new Error("contentType is required for a presigned upload.");
  }

  const folder = FOLDERS[kind] || "stories/media/misc";
  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const key = `${folder}/${Date.now()}-${nanoid(12)}${cleanExt ? `.${cleanExt}` : ""}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });

  return { uploadUrl, key, url: buildPublicUrl(key), expiresIn: expiresInSeconds };
}

/** Delete an object from R2 by key or full URL (best-effort). */
export async function deleteObject({ key, url }) {
  const objectKey = key || objectKeyFromUrl(url);
  if (!objectKey || !BUCKET) return;

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: objectKey }));
  } catch (error) {
    console.warn(`[r2] Failed to delete object ${objectKey}:`, error.message);
  }
}

export { s3, BUCKET };
