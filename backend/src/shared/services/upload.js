import { nanoid } from "nanoid";
import cloudinary from "../config/cloudinary.js";

function uploadBuffer(buffer, folder, resourceType = "image") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `lifebookz/${folder}`,
        public_id: nanoid(),
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}

export const uploadAvatar = (buffer) =>
  uploadBuffer(buffer, "avatars", "image");

export const uploadDocument = (buffer) =>
  uploadBuffer(buffer, "documents", "auto");

export async function deleteFile(publicId) {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
}
