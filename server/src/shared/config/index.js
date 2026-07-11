import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    databases: {
      users: process.env.MONGO_USERS_DB || 'lifebookz_users',
      authors: process.env.MONGO_AUTHORS_DB || 'lifebookz_authors',
      stories: process.env.MONGO_STORIES_DB || 'lifebookz_stories',
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@lifebookz.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    key: process.env.ADMIN_KEY || 'admin-secret-key-change-in-production',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
  },

  r2: {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET || 'lifebookz-media',
    publicUrl: process.env.R2_PUBLIC_URL,
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sqs: {
      queueUrl: process.env.SQS_QUEUE_URL,
    },
  },

  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v4',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  },

  cookie: {
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default config;
