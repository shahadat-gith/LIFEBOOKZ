import dotenv from "dotenv";
dotenv.config();

const config = {
  env: process.env.NODE_ENV || "dev",
  port: parseInt(process.env.PORT, 10) || 5000,

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    key: process.env.ADMIN_KEY,
  },

  developer: {
    email: process.env.DEVELOPER_EMAIL,
    password: process.env.DEVELOPER_PASSWORD,
  },

  mail: {
    user: process.env.APP_MAIL_USERNAME,
    password: process.env.APP_MAIL_PASSWORD,
  },

  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    secretKey: process.env.CLOUDINARY_API_SECRET,
  },

  qdrant: {
    url: process.env.QDRANT_ENDPOINT,
    apiKey: process.env.QDRANT_API_KEY,
    vectorSize: 2560,
    collections: {
      user: "lifebookz_user_embeddings",
      story: "lifebookz_story_embeddings",
      expert: "lifebookz_expert_embeddings",
    },
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    chatModel: process.env.OPENROUTER_CHAT_MODEL,
    embeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL,
    baseUrl: process.env.OPENROUTER_BASE_URL,
  },

  frontend: {
    admin: process.env.FRONTEND_ADMIN_URL,
    client: process.env.FRONTEND_CLIENT_URL,
    author: process.env.FRONTEND_AUTHOR_URL,
    expert: process.env.FRONTEND_EXPERT_URL,
    developer: process.env.FRONTEND_DEVELOPER_URL,
  },
};

export default config;
