import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';
import { nanoid } from 'nanoid';

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.secretKey,
});

async function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lifebookz/${folder}`,
        public_id: nanoid(),
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    uploadStream.end(buffer);
  });
}

export async function uploadImage(buffer) {
  return uploadBuffer(buffer, 'images');
}

export async function uploadAvatar(buffer) {
  return uploadBuffer(buffer, 'avatars');
}

export async function uploadDocument(buffer) {
  return uploadBuffer(buffer, 'documents');
}

export async function deleteFile(publicId) {
  await cloudinary.uploader.destroy(publicId);
  return { message: 'File deleted' };
}
