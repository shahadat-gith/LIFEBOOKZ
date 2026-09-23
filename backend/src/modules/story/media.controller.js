import {
  createPresignedUpload,
  deleteObject,
  objectKeyFromUrl,
} from "../../core/config/r2.js";
import { validationError } from "../../core/utils/errors.js";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-msvideo",
  "video/mpeg",
];

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

function extFromName(filename = "") {
  const match = filename.match(/\.([a-zA-Z0-9]{1,8})$/);
  return match ? match[1].toLowerCase() : "";
}

/**
 * POST /stories/media/presign
 * Mint a presigned PUT URL so the browser uploads the file DIRECTLY to R2 —
 * the file never passes through this server. No queue is involved: the
 * stored URL is returned immediately and is usable as soon as the PUT lands.
 */
export async function presignMediaUpload(req, res, next) {
  try {
    const { contentType, kind, size, filename } = req.body || {};

    const isImage = IMAGE_TYPES.includes(contentType);
    const isVideo = VIDEO_TYPES.includes(contentType);

    if (!isImage && !isVideo) {
      throw validationError(
        "Unsupported media type. Only photos and videos are allowed.",
      );
    }

    const bytes = Number(size) || 0;
    const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (bytes > limit) {
      throw validationError(
        isImage
          ? "Photos must be 15 MB or smaller."
          : "Videos must be 500 MB or smaller.",
      );
    }

    const upload = await createPresignedUpload({
      kind: isImage ? "image" : "video",
      contentType,
      ext: extFromName(filename),
    });

    res.status(201).json({
      success: true,
      data: {
        uploadUrl: upload.uploadUrl,
        key: upload.key,
        url: upload.url,
        expiresIn: upload.expiresIn,
        type: isImage ? "image" : "video",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /stories/media — remove an uploaded object from R2 by key or url.
 */
export async function deleteMedia(req, res, next) {
  try {
    const { key, url } = req.body || {};
    const objectKey = key || objectKeyFromUrl(url);

    if (!objectKey) {
      throw validationError("Provide the media key or url to delete.");
    }

    await deleteObject({ key: objectKey });

    res.json({ success: true, message: "Media deleted." });
  } catch (error) {
    next(error);
  }
}
