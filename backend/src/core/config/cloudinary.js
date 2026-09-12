import { v2 as cloudinary } from 'cloudinary';
import config from './index.js';

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.secretKey,
});

export default cloudinary;