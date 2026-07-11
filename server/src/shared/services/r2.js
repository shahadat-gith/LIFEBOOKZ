import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import r2Client from '../config/r2.js';
import config from '../config/index.js';

const BUCKET = config.r2.bucket;
const PUBLIC_URL = config.r2.publicUrl;

async function uploadBuffer(buffer, key, contentType) {
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${PUBLIC_URL}/${key}`;
}

export async function uploadImage(buffer, originalName) {
  const ext = originalName.split('.').pop() || 'jpg';
  const key = `images/${nanoid()}.${ext}`;
  const url = await uploadBuffer(buffer, key, `image/${ext}`);
  return { url, key };
}

export async function uploadVideo(buffer, originalName) {
  const ext = originalName.split('.').pop() || 'mp4';
  const key = `videos/${nanoid()}.${ext}`;
  const url = await uploadBuffer(buffer, key, `video/${ext}`);
  return { url, key };
}

export async function uploadAudio(buffer, originalName) {
  const ext = originalName.split('.').pop() || 'mp3';
  const key = `audio/${nanoid()}.${ext}`;
  const url = await uploadBuffer(buffer, key, `audio/${ext}`);
  return { url, key };
}

export async function uploadAvatar(buffer, originalName) {
  const ext = originalName.split('.').pop() || 'jpg';
  const key = `avatars/${nanoid()}.${ext}`;
  const url = await uploadBuffer(buffer, key, `image/${ext}`);
  return { url, key };
}



export async function deleteFile(key) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  return { message: 'File deleted' };
}
